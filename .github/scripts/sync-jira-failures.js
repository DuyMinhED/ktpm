const fs = require("fs");
const https = require("https");
const crypto = require("crypto");

const REPORT_FILES = [
  { name: "Admin API", file: "./postman-reports/summary-admin.json" },
  { name: "Clinic API", file: "./postman-reports/summary-clinic.json" },
  { name: "Doctor API", file: "./postman-reports/summary-doctor.json" },
  { name: "Patient API", file: "./postman-reports/summary-patient.json" },
];

let members;
try {
  members = JSON.parse(process.env.JIRA_MEMBER_IDS);
  if (!Array.isArray(members) || members.length === 0) throw new Error();
} catch {
  console.error("JIRA_MEMBER_IDS is invalid. Check the GitHub Actions secret.");
  process.exit(1);
}

if (!process.env.JIRA_BASE_URL) {
  console.error("JIRA_BASE_URL is missing. Configure the GitHub Actions secret.");
  process.exit(1);
}

const BASE_URL = process.env.JIRA_BASE_URL.replace(/\/$/, "");
const AUTH = Buffer.from(
  `${process.env.JIRA_USER_EMAIL}:${process.env.JIRA_API_TOKEN}`
).toString("base64");

function makeFingerprint(moduleName, apiName) {
  const raw = `${moduleName}::${apiName}`.toLowerCase().trim();
  return `fp-${crypto.createHash("sha1").update(raw).digest("hex").slice(0, 10)}`;
}

function jiraRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const url = new URL(`${BASE_URL}${path}`);
    const headers = {
      Authorization: `Basic ${AUTH}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    if (bodyStr) headers["Content-Length"] = Buffer.byteLength(bodyStr);

    const req = https.request(
      { hostname: url.hostname, path: url.pathname + url.search, method, headers },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );
    req.on("error", reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function findExistingIssue(label) {
  const jql = `project = "${process.env.PROJECT_KEY}" AND labels = "${label}" AND statusCategory != Done`;

  try {
    const res = await jiraRequest("POST", "/rest/api/3/search/jql", {
      jql,
      maxResults: 1,
      fields: ["summary", "status"],
    });
    if (res.status !== 200) {
      console.warn(`Search API returned HTTP ${res.status}; duplicate check skipped.`);
      return null;
    }
    return res.body?.issues?.[0] ?? null;
  } catch (err) {
    console.warn(`Search API connection failed (${err.message}); duplicate check skipped.`);
    return null;
  }
}

function adfText(text, marks = []) {
  return { type: "text", text, ...(marks.length ? { marks } : {}) };
}

function paragraph(text) {
  return { type: "paragraph", content: [adfText(text)] };
}

function bulletList(items) {
  return {
    type: "bulletList",
    content: items.map((item) => ({
      type: "listItem",
      content: [paragraph(item)],
    })),
  };
}

async function addWarningComment(issueKey) {
  const payload = {
    body: {
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [
            adfText("[CI/CD warning] ", [{ type: "strong" }]),
            adfText("This failure reappeared in the latest pipeline run."),
          ],
        },
        bulletList([
          `Actor: ${process.env.ACTOR}`,
          `Branch: ${process.env.BRANCH}`,
        ]),
        paragraph("See GitHub Actions logs and artifacts for details."),
      ],
    },
  };

  const res = await jiraRequest("POST", `/rest/api/3/issue/${issueKey}/comment`, payload);
  if (res.status === 201) {
    console.log(`Added warning comment to ${issueKey}.`);
  } else {
    console.error(`Failed to add comment to ${issueKey} (HTTP ${res.status}).`);
  }
}

async function createIssue({ summary, labels, descriptionItems }, assigneeId) {
  const payload = {
    fields: {
      project: { key: process.env.PROJECT_KEY },
      summary,
      issuetype: { name: "Bug" },
      priority: { name: "High" },
      assignee: { id: assigneeId },
      labels,
      description: {
        type: "doc",
        version: 1,
        content: [
          paragraph("CI/CD detected a deployed environment or API test failure."),
          bulletList(descriptionItems),
          paragraph("See GitHub Actions logs and artifacts for details."),
        ],
      },
    },
  };

  const res = await jiraRequest("POST", "/rest/api/3/issue", payload);
  return res.body;
}

function collectApiFailures() {
  const seen = new Set();
  const failures = [];

  for (const item of REPORT_FILES) {
    if (!fs.existsSync(item.file)) continue;
    const data = JSON.parse(fs.readFileSync(item.file, "utf8"));
    for (const fail of data?.run?.failures ?? []) {
      const apiName = fail?.source?.name ?? "Unknown API";
      const errorMsg = (fail?.error?.message ?? "Assertion failed")
        .replace(/[\r\n"]+/g, " ")
        .trim();
      const key = `${item.name}|||${apiName}`;
      if (!seen.has(key)) {
        seen.add(key);
        failures.push({ moduleName: item.name, apiName, errorMsg });
      }
    }
  }

  return failures;
}

function collectRuntimeFailures() {
  const failures = [];

  if (process.env.DEPLOY_STEP_OUTCOME === "failure") {
    failures.push({
      label: "deploy-fail",
      summary: "[CI/CD] Render Deploy Failed or Timeout",
      labels: ["deploy-fail", "render", "auto-created"],
      descriptionItems: [
        "Render deploy wait failed or timed out before the deployed backend became live.",
        `Outcome: ${process.env.DEPLOY_STEP_OUTCOME}`,
        `Actor: ${process.env.ACTOR}`,
        `Branch: ${process.env.BRANCH}`,
      ],
    });
  }

  if (process.env.HEALTH_STEP_OUTCOME === "failure") {
    failures.push({
      label: "health-check",
      summary: "[CI/CD] Backend Health Check Failed",
      labels: ["health-check", "auto-created"],
      descriptionItems: [
        "Backend health check failed after deploy.",
        `Outcome: ${process.env.HEALTH_STEP_OUTCOME}`,
        `Actor: ${process.env.ACTOR}`,
        `Branch: ${process.env.BRANCH}`,
      ],
    });
  }

  return failures;
}

async function syncIssue(issue, assigneeIdx) {
  const existing = await findExistingIssue(issue.label);

  if (existing) {
    console.log(`Duplicate found: ${existing.key} (${existing.fields?.status?.name}) - "${issue.summary}"`);
    await addWarningComment(existing.key);
    return { created: 0, commented: 1, nextAssigneeIdx: assigneeIdx };
  }

  const assigneeId = members[assigneeIdx % members.length];
  const result = await createIssue(issue, assigneeId);
  if (result?.key) {
    console.log(`Created: ${result.key} - "${issue.summary}"`);
    return { created: 1, commented: 0, nextAssigneeIdx: assigneeIdx + 1 };
  }

  console.error(`Create failed: "${issue.summary}"`, JSON.stringify(result));
  return { created: 0, commented: 0, nextAssigneeIdx: assigneeIdx };
}

async function main() {
  const runtimeIssues = collectRuntimeFailures();
  const apiIssues = collectApiFailures().map((bug) => {
    const fingerprint = makeFingerprint(bug.moduleName, bug.apiName);
    return {
      label: fingerprint,
      summary: `[CI/CD] API Failure: ${bug.apiName} (${bug.moduleName})`,
      labels: [fingerprint, "auto-created"],
      descriptionItems: [
        `Collection: ${bug.moduleName}`,
        `API: ${bug.apiName}`,
        `Error: ${bug.errorMsg}`,
        `Fingerprint: ${fingerprint}`,
        `Actor: ${process.env.ACTOR}`,
        `Branch: ${process.env.BRANCH}`,
      ],
    };
  });

  const issues = [...runtimeIssues, ...apiIssues];
  if (issues.length === 0) {
    console.log("No runtime or API failures found; Jira sync skipped.");
    return;
  }

  let created = 0;
  let commented = 0;
  let assigneeIdx = 0;

  for (const issue of issues) {
    const result = await syncIssue(issue, assigneeIdx);
    created += result.created;
    commented += result.commented;
    assigneeIdx = result.nextAssigneeIdx;
  }

  console.log(`Jira sync done. Created: ${created} | Commented: ${commented} | Total: ${issues.length}`);
}

main().catch((err) => {
  console.error("Unexpected Jira sync error:", err);
  process.exit(1);
});
