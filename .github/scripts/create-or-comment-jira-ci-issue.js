const crypto = require("crypto");
const https = require("https");

const env = process.env;

const jobResults = {
  "backend-test": env.BACKEND_RESULT || "unknown",
  "frontend-test": env.FRONTEND_RESULT || "unknown",
  "postman-test": env.POSTMAN_RESULT || "unknown",
  "e2e-test": env.E2E_RESULT || "unknown",
  "docker-build": env.DOCKER_RESULT || "unknown",
};

const categoryOrder = [
  ["backend-test", "backend-test-failed"],
  ["frontend-test", "frontend-build-failed"],
  ["postman-test", "postman-api-test-failed"],
  ["e2e-test", "e2e-test-failed"],
  ["docker-build", "docker-build-failed"],
];

function required(name, value) {
  if (!value) {
    console.error(`${name} is required.`);
    process.exit(1);
  }
  return value;
}

const jiraBaseUrl = required("JIRA_BASE_URL", env.JIRA_BASE_URL || "").replace(/\/$/, "");
const jiraEmail = required("JIRA_EMAIL or JIRA_USER_EMAIL", env.JIRA_EMAIL || env.JIRA_USER_EMAIL || "");
const jiraApiToken = required("JIRA_API_TOKEN", env.JIRA_API_TOKEN || "");
const jiraProjectKey = env.JIRA_PROJECT_KEY || "KCPM";
const configuredIssueType = env.JIRA_ISSUE_TYPE || "Bug";
const jiraMemberIds = parseMemberIds(env.JIRA_MEMBER_IDS || "");

const repository = env.GITHUB_REPOSITORY || "unknown-repository";
const workflow = env.GITHUB_WORKFLOW || "Production CI";
const branch = env.GITHUB_REF_NAME || "unknown-branch";
const sha = env.GITHUB_SHA || "unknown-sha";
const shortSha = sha.slice(0, 7);
const actor = env.GITHUB_ACTOR || "unknown-actor";
const runId = env.GITHUB_RUN_ID || "";
const runUrl = runId ? `https://github.com/${repository}/actions/runs/${runId}` : "unknown-run-url";

function failureCategory() {
  const failed = categoryOrder.filter(([job]) => jobResults[job] === "failure");
  if (failed.length > 1) return "multiple-ci-failures";
  if (failed.length === 1) return failed[0][1];

  const cancelled = categoryOrder.find(([job]) => jobResults[job] === "cancelled");
  if (cancelled) return `${cancelled[0]}-cancelled`;

  return "unknown-ci-failed";
}

const category = failureCategory();
const fingerprintSource = `${repository}|${workflow}|${branch}|${category}`;
const fingerprintHash = crypto.createHash("sha256").update(fingerprintSource).digest("hex").slice(0, 10);
const fingerprintLabel = `ci-fingerprint-${fingerprintHash}`;

function authHeader() {
  return `Basic ${Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString("base64")}`;
}

function parseMemberIds(raw) {
  if (!raw.trim()) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(String).map((item) => item.trim()).filter(Boolean);
    }
  } catch {
    // Fall back to comma-separated values for simple classroom setup.
  }

  return raw.split(",").map((item) => item.trim()).filter(Boolean);
}

function selectedAssignee() {
  if (jiraMemberIds.length === 0) return null;

  const idx = parseInt(fingerprintHash.slice(0, 8), 16) % jiraMemberIds.length;
  return jiraMemberIds[idx];
}

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${jiraBaseUrl}${path}`);
    const payload = body ? JSON.stringify(body) : "";
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        Authorization: authHeader(),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };

    if (payload) {
      options.headers["Content-Length"] = Buffer.byteLength(payload);
    }

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        let parsed = data;
        try {
          parsed = data ? JSON.parse(data) : {};
        } catch {
          // Keep raw text for diagnostics without exposing secrets.
        }
        resolve({ status: res.statusCode, body: parsed });
      });
    });

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function adfText(text) {
  return {
    type: "doc",
    version: 1,
    content: text.split("\n").map((line) => ({
      type: "paragraph",
      content: [{ type: "text", text: line || " " }],
    })),
  };
}

function jobResultsText() {
  return Object.entries(jobResults)
    .map(([job, result]) => `- ${job}: ${result}`)
    .join("\n");
}

function issueDescription() {
  return [
    `Repository: ${repository}`,
    `Workflow: ${workflow}`,
    `Branch: ${branch}`,
    `Commit SHA: ${sha}`,
    `Actor: ${actor}`,
    `Failure category: ${category}`,
    `Fingerprint: ${fingerprintLabel}`,
    `GitHub Actions run URL: ${runUrl}`,
    "",
    "Job results:",
    jobResultsText(),
    "",
    "Expected result:",
    "- Backend tests pass",
    "- Frontend build/lint pass",
    "- Postman/Newman pass",
    "- E2E pass",
    "- Docker build pass",
    "",
    "Actual result:",
    "- CI failed in one or more jobs.",
    "",
    "Suggested action:",
    "- Open GitHub Actions run URL",
    "- Check failed job log",
    "- Download artifact if needed",
    "- Reproduce locally",
    "- Fix code/test/config",
    "- Push again to verify",
  ].join("\n");
}

function repeatFailureComment() {
  return [
    "CI failed again with the same fingerprint.",
    "",
    `Repository: ${repository}`,
    `Branch: ${branch}`,
    `Commit: ${sha}`,
    `Actor: ${actor}`,
    `Failure category: ${category}`,
    `Fingerprint: ${fingerprintLabel}`,
    `GitHub Actions run: ${runUrl}`,
    "",
    "Job results:",
    jobResultsText(),
    "",
    "Note:",
    "This failure matches an existing open Jira issue, so no duplicate issue was created.",
  ].join("\n");
}

async function findExistingIssue() {
  const jql = `project = ${jiraProjectKey} AND labels = "${fingerprintLabel}" AND statusCategory != Done`;
  const path = `/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=1&fields=summary,status`;
  const response = await request("GET", path);

  if (response.status !== 200) {
    console.error(`Jira search failed with HTTP ${response.status}.`);
    console.error(JSON.stringify(response.body));
    process.exit(1);
  }

  return response.body && response.body.issues && response.body.issues[0];
}

async function addComment(issueKey) {
  const response = await request("POST", `/rest/api/3/issue/${issueKey}/comment`, {
    body: adfText(repeatFailureComment()),
  });

  if (response.status !== 201) {
    console.error(`Failed to comment on ${issueKey}. HTTP ${response.status}.`);
    console.error(JSON.stringify(response.body));
    process.exit(1);
  }

  console.log(`Commented on existing Jira issue: ${issueKey}`);
}

async function createIssue(issueType) {
  const assigneeId = selectedAssignee();
  const labels = [
    "ci",
    "github-actions",
    "auto-bug",
    jiraProjectKey.toLowerCase(),
    category,
    fingerprintLabel,
  ];

  const fields = {
    project: { key: jiraProjectKey },
    summary: `[CI FAILED] ${category} - ${repository} - ${branch} - ${shortSha}`,
    issuetype: { name: issueType },
    labels,
    description: adfText(issueDescription()),
  };

  if (assigneeId) {
    fields.assignee = { id: assigneeId };
  }

  const response = await request("POST", "/rest/api/3/issue", {
    fields: {
      ...fields,
    },
  });

  if (response.status === 201 && response.body && response.body.key) {
    console.log(`Created Jira issue: ${response.body.key}`);
    return true;
  }

  if (issueType !== "Task") {
    console.warn(`Create issue with type ${issueType} failed with HTTP ${response.status}; retrying with Task.`);
    return createIssue("Task");
  }

  console.error(`Failed to create Jira issue. HTTP ${response.status}.`);
  console.error(JSON.stringify(response.body));
  process.exit(1);
}

async function main() {
  console.log(`Failure category: ${category}`);
  console.log(`Fingerprint: ${fingerprintLabel}`);

  const existing = await findExistingIssue();
  if (existing && existing.key) {
    await addComment(existing.key);
    return;
  }

  await createIssue(configuredIssueType);
}

main().catch((error) => {
  console.error(`Unexpected Jira sync error: ${error.message}`);
  process.exit(1);
});
