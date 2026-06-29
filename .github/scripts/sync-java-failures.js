const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const https = require("https");

const reportsDir = path.join(__dirname, "../../backend/target/surefire-reports");
if (!fs.existsSync(reportsDir)) {
  console.log("Surefire reports directory not found. Skipping Java failure sync.");
  process.exit(0);
}

let members;
try {
  members = JSON.parse(process.env.JIRA_MEMBER_IDS);
  if (!Array.isArray(members) || members.length === 0) throw new Error();
} catch {
  console.error("JIRA_MEMBER_IDS is invalid or missing. Skipping Jira sync.");
  process.exit(0);
}

if (!process.env.JIRA_BASE_URL) {
  console.error("JIRA_BASE_URL is missing. Skipping Jira sync.");
  process.exit(0);
}

const BASE_URL = process.env.JIRA_BASE_URL.replace(/\/$/, "");
const AUTH = Buffer.from(
  `${process.env.JIRA_USER_EMAIL}:${process.env.JIRA_API_TOKEN}`
).toString("base64");

function makeFingerprint(classname, methodName) {
  const raw = `${classname}::${methodName}`.toLowerCase().trim();
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
            adfText("This Java test failure reappeared in the latest pipeline run."),
          ],
        },
        bulletList([
          `Actor: ${process.env.ACTOR}`,
          `Branch: ${process.env.BRANCH}`,
        ]),
        paragraph("See GitHub Actions logs for details."),
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
          paragraph("CI/CD detected a Java Unit/Integration Test failure."),
          bulletList(descriptionItems),
          paragraph("See GitHub Actions logs and artifacts for the full stack trace."),
        ],
      },
    },
  };

  const res = await jiraRequest("POST", "/rest/api/3/issue", payload);
  return res.body;
}

function collectJavaFailures() {
  const failures = [];
  const files = fs.readdirSync(reportsDir).filter(f => f.endsWith(".xml"));

  for (const file of files) {
    const filePath = path.join(reportsDir, file);
    const content = fs.readFileSync(filePath, "utf8");

    const testcaseRegex = /<testcase\s+([^>]+)>([\s\S]*?)<\/testcase>/g;
    let match;
    while ((match = testcaseRegex.exec(content)) !== null) {
      const attributesStr = match[1];
      const innerContent = match[2];

      if (innerContent.includes("<failure")) {
        const nameMatch = /name="([^"]+)"/.exec(attributesStr);
        const classnameMatch = /classname="([^"]+)"/.exec(attributesStr);
        
        const failureMatch = /<failure\s+message="([^"]+)"/.exec(innerContent) 
                          || /<failure[^>]*>([\s\S]*?)<\/failure>/.exec(innerContent);

        const name = nameMatch ? nameMatch[1] : "UnknownTest";
        const classname = classnameMatch ? classnameMatch[1] : "UnknownClass";
        const message = failureMatch 
          ? (failureMatch[1] || "Assertion failed").replace(/[\r\n"]+/g, " ").trim() 
          : "Assertion failed";

        failures.push({ classname, name, message });
      }
    }
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
  const javaFailures = collectJavaFailures().map((bug) => {
    const fingerprint = makeFingerprint(bug.classname, bug.name);
    return {
      label: fingerprint,
      summary: `[CI/CD] Java Test Failure: ${bug.name} (${bug.classname.substring(bug.classname.lastIndexOf('.') + 1)})`,
      labels: [fingerprint, "bug", "auto-created"],
      descriptionItems: [
        `Class: ${bug.classname}`,
        `Method: ${bug.name}`,
        `Error: ${bug.message}`,
        `Fingerprint: ${fingerprint}`,
        `Actor: ${process.env.ACTOR}`,
        `Branch: ${process.env.BRANCH}`,
      ],
    };
  });

  if (javaFailures.length === 0) {
    console.log("No Java unit test failures found; Jira sync skipped.");
    return;
  }

  let created = 0;
  let commented = 0;
  let assigneeIdx = 0;

  for (const issue of javaFailures) {
    const result = await syncIssue(issue, assigneeIdx);
    created += result.created;
    commented += result.commented;
    assigneeIdx = result.nextAssigneeIdx;
  }

  console.log(`Java failures Jira sync completed. Created: ${created} | Commented: ${commented} | Total: ${javaFailures.length}`);
}

main().catch((err) => {
  console.error("Unexpected Jira sync error for Java failures:", err);
  process.exit(1);
});
