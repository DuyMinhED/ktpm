const crypto = require("crypto");
const fs = require("fs");
const https = require("https");
const nodePath = require("path");

const env = process.env;

const jobResults = {
  "backend-test": env.BACKEND_RESULT || "unknown",
  "frontend-test": env.FRONTEND_RESULT || "unknown",
  "postman-test": env.POSTMAN_RESULT || "unknown",
  "e2e-test": env.E2E_RESULT || "unknown",
  "docker-build": env.DOCKER_RESULT || "unknown",
};

const failureDefinitions = [
  {
    result: env.BACKEND_RESULT,
    jobName: "backend-test",
    category: "backend-test-failed",
    summaryFile: "backend.txt",
  },
  {
    result: env.FRONTEND_RESULT,
    jobName: "frontend-test",
    category: "frontend-build-failed",
    summaryFile: "frontend.txt",
  },
  {
    result: env.POSTMAN_RESULT,
    jobName: "postman-test",
    category: "postman-api-test-failed",
    summaryFile: "postman.txt",
  },
  {
    result: env.E2E_RESULT,
    jobName: "e2e-test",
    category: "e2e-test-failed",
    summaryFile: "e2e.txt",
  },
  {
    result: env.DOCKER_RESULT,
    jobName: "docker-build",
    category: "docker-build-failed",
    summaryFile: "docker.txt",
  },
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

function buildFailureItems() {
  const items = failureDefinitions
    .filter((definition) => definition.result === "failure")
    .map(({ jobName, category, summaryFile }) => ({ jobName, category, summaryFile }));

  if (items.length > 0) return items;

  return [
    {
      jobName: "unknown",
      category: "unknown-ci-failed",
      summaryFile: null,
    },
  ];
}

function createFingerprint(category) {
  const source = `${repository}|${workflow}|${branch}|${category}`;
  const hash = crypto.createHash("sha256").update(source).digest("hex").slice(0, 10);

  return {
    hash,
    label: `ci-fingerprint-${hash}`,
  };
}

function selectedAssignee(fingerprintHash) {
  if (jiraMemberIds.length === 0) return null;

  const idx = parseInt(fingerprintHash.slice(0, 8), 16) % jiraMemberIds.length;
  return jiraMemberIds[idx];
}

function authHeader() {
  return `Basic ${Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString("base64")}`;
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

function readFailureSummaryForFile(summaryFile) {
  if (!summaryFile) {
    return "No detailed failure summary found for this job. Check GitHub Actions logs.";
  }

  const dir = env.CI_FAILURE_SUMMARY_DIR || "ci-failure-summaries";
  const fullPath = nodePath.join(dir, summaryFile);

  if (!fs.existsSync(fullPath)) {
    return "No detailed failure summary found for this job. Check GitHub Actions logs.";
  }

  let content = fs.readFileSync(fullPath, "utf8");

  if (content.length > 6000) {
    content = `${content.slice(0, 6000)}\n... truncated ...`;
  }

  return content;
}

function issueDescription(item, fingerprintLabel) {
  return [
    `Repository: ${repository}`,
    `Workflow: ${workflow}`,
    `Branch: ${branch}`,
    `Commit SHA: ${sha}`,
    `Actor: ${actor}`,
    `Failed job: ${item.jobName}`,
    `Failure category: ${item.category}`,
    `Fingerprint: ${fingerprintLabel}`,
    `GitHub Actions run URL: ${runUrl}`,
    "",
    "Job results:",
    jobResultsText(),
    "",
    "Failure details:",
    readFailureSummaryForFile(item.summaryFile),
    "",
    "Expected result:",
    "- This CI job should pass.",
    "",
    "Actual result:",
    "- This CI job failed.",
    "",
    "Suggested action:",
    "- Open GitHub Actions run URL",
    "- Check artifact/log for this job",
    "- Reproduce locally",
    "- Fix code/test/config",
    "- Push again to verify",
  ].join("\n");
}

function repeatFailureComment(item, fingerprintLabel) {
  return [
    "CI failed again with the same fingerprint.",
    "",
    `Repository: ${repository}`,
    `Branch: ${branch}`,
    `Commit: ${sha}`,
    `Actor: ${actor}`,
    `Failed job: ${item.jobName}`,
    `Failure category: ${item.category}`,
    `Fingerprint: ${fingerprintLabel}`,
    `GitHub Actions run: ${runUrl}`,
    "",
    "Failure details from this run:",
    readFailureSummaryForFile(item.summaryFile),
    "",
    "Note:",
    "This failure matches an existing open Jira issue, so no duplicate issue was created.",
  ].join("\n");
}

async function findExistingIssue(fingerprintLabel) {
  const jql = `project = ${jiraProjectKey} AND labels = "${fingerprintLabel}" AND statusCategory != Done`;
  const response = await request("POST", "/rest/api/3/search/jql", {
    jql,
    maxResults: 1,
    fields: ["summary", "status"],
  });

  if (response.status !== 200) {
    console.error(`Jira search failed with HTTP ${response.status}.`);
    console.error(JSON.stringify(response.body));
    process.exit(1);
  }

  return response.body && response.body.issues && response.body.issues[0];
}

async function addComment(issueKey, item, fingerprintLabel) {
  const response = await request("POST", `/rest/api/3/issue/${issueKey}/comment`, {
    body: adfText(repeatFailureComment(item, fingerprintLabel)),
  });

  if (response.status !== 201) {
    console.error(`Failed to comment on ${issueKey}. HTTP ${response.status}.`);
    console.error(JSON.stringify(response.body));
    process.exit(1);
  }

  console.log(`Commented on existing Jira issue: ${issueKey}`);
}

async function createIssue(issueType, item, fingerprint) {
  const assigneeId = selectedAssignee(fingerprint.hash);
  const labels = [
    "ci",
    "github-actions",
    "auto-bug",
    jiraProjectKey.toLowerCase(),
    item.category,
    fingerprint.label,
  ];

  const fields = {
    project: { key: jiraProjectKey },
    summary: `[CI FAILED] ${item.category} - ${repository} - ${branch} - ${shortSha}`,
    issuetype: { name: issueType },
    labels,
    description: adfText(issueDescription(item, fingerprint.label)),
  };

  if (assigneeId) {
    fields.assignee = { id: assigneeId };
  }

  const response = await request("POST", "/rest/api/3/issue", { fields });

  if (response.status === 201 && response.body && response.body.key) {
    console.log(`Created Jira issue: ${response.body.key}`);
    return true;
  }

  if (issueType !== "Task") {
    console.warn(`Create issue with type ${issueType} failed with HTTP ${response.status}; retrying with Task.`);
    return createIssue("Task", item, fingerprint);
  }

  console.error(`Failed to create Jira issue. HTTP ${response.status}.`);
  console.error(JSON.stringify(response.body));
  process.exit(1);
}

async function processFailureItem(item) {
  const fingerprint = createFingerprint(item.category);

  console.log(`Processing failure item: ${item.category}`);
  console.log(`Fingerprint: ${fingerprint.label}`);

  const existing = await findExistingIssue(fingerprint.label);
  if (existing && existing.key) {
    await addComment(existing.key, item, fingerprint.label);
    return;
  }

  await createIssue(configuredIssueType, item, fingerprint);
}

async function main() {
  const failureItems = buildFailureItems();

  for (const item of failureItems) {
    await processFailureItem(item);
  }
}

main().catch((error) => {
  console.error(`Unexpected Jira sync error: ${error.message}`);
  process.exit(1);
});
