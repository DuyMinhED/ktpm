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
    titleHint: "Backend Maven test failures",
  },
  {
    result: env.FRONTEND_RESULT,
    jobName: "frontend-test",
    category: "frontend-build-failed",
    summaryFile: "frontend.txt",
    titleHint: "Frontend lint/typecheck/build failures",
  },
  {
    result: env.POSTMAN_RESULT,
    jobName: "postman-test",
    category: "postman-api-test-failed",
    summaryFile: "postman.txt",
    titleHint: "Postman/Newman API test failures",
  },
  {
    result: env.E2E_RESULT,
    jobName: "e2e-test",
    category: "e2e-test-failed",
    summaryFile: "e2e.txt",
    titleHint: "CodeceptJS/Playwright E2E failures",
  },
  {
    result: env.DOCKER_RESULT,
    jobName: "docker-build",
    category: "docker-build-failed",
    summaryFile: "docker.txt",
    titleHint: "Backend Docker build failures",
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
      titleHint: "Unknown CI failure",
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
    return "No summary file was mapped for this failure item.";
  }

  const dir = env.CI_FAILURE_SUMMARY_DIR || "ci-failure-summaries";
  const fullPath = nodePath.join(dir, summaryFile);

  if (!fs.existsSync(fullPath)) {
    return `No detailed failure summary found for ${summaryFile}. Check GitHub Actions logs.`;
  }

  let content = fs.readFileSync(fullPath, "utf8");

  if (content.length > 6000) {
    content = `${content.slice(0, 6000)}\n... truncated ...`;
  }

  return content;
}

function pickLines(raw, patterns, limit = 20) {
  const lines = raw.split("\n");
  const picked = [];

  for (const line of lines) {
    if (patterns.some((pattern) => line.toLowerCase().includes(pattern.toLowerCase()))) {
      picked.push(line);
    }
    if (picked.length >= limit) break;
  }

  return picked.length ? picked.join("\n") : "No representative lines found in summary.";
}

function bugSection(title, bug, evidence, suggestedFix) {
  return [
    `### ${title}`,
    "",
    "**Bug:**",
    bug,
    "",
    "**Evidence:**",
    "```text",
    evidence,
    "```",
    "",
    "**Suggested fix:**",
    suggestedFix,
  ].join("\n");
}

function buildBackendDiagnosis(rawSummary) {
  const sections = [];

  if (rawSummary.includes("testPasswordLengthMinMinusOne") || rawSummary.includes("Password with 7 characters")) {
    sections.push(
      bugSection(
        "Password Length Validation",
        "Current code accepts a 7-character password, but the SRS/test expects passwords shorter than 8 characters to be rejected.",
        pickLines(rawSummary, ["testPasswordLengthMinMinusOne", "Password with 7 characters", "IllegalArgumentException", "nothing was thrown"], 12),
        "Update `AdminUserServiceImpl.validatePasswordPolicy` or the relevant DTO validation to reject password length `< 8`."
      )
    );
  }

  if (rawSummary.includes("testEmailLengthMaxPlusOne") || rawSummary.includes("Email with 101 chars")) {
    sections.push(
      bugSection(
        "Email Length Validation",
        "Current validation accepts an email with 101 characters, but the test/SRS expects email length to be limited to 100 characters.",
        pickLines(rawSummary, ["testEmailLengthMaxPlusOne", "Email with 101 chars", "expected:", "but was:"], 12),
        "Add `@Size(max = 100)` to the email field in the related request DTO, or enforce the rule in service validation."
      )
    );
  }

  if (rawSummary.includes("testStatusLengthMaxPlusOne") || rawSummary.includes("Status with 31 chars")) {
    sections.push(
      bugSection(
        "Account Status Length Validation",
        "Current validation accepts a status string with 31 characters, but the test/SRS expects status length to be limited to 30 characters.",
        pickLines(rawSummary, ["testStatusLengthMaxPlusOne", "Status with 31 chars", "expected:", "but was:"], 12),
        "Add `@Size(max = 30)` to the status field in the related request DTO, or enforce the rule in service validation."
      )
    );
  }

  if (rawSummary.includes("Failed to load ApplicationContext") || /Table\s+".+"\s+not found/i.test(rawSummary)) {
    sections.push(
      bugSection(
        "Spring Test Context / H2 Schema Failure",
        "The Spring test context or H2 schema initialization failed.",
        pickLines(rawSummary, ["Failed to load ApplicationContext", "Table", "not found", "schema", "ddl"], 20),
        "Review `application-test.yml`, JPA `ddl-auto`, H2 compatibility mode, entity mappings, and test data initialization."
      )
    );
  }

  if (rawSummary.includes("AssertionFailedError")) {
    sections.push(
      bugSection(
        "Backend Unit/Integration Test Assertion Failed",
        "A backend test assertion failed, which means the current implementation does not satisfy the expected behavior defined by the test/SRS.",
        pickLines(rawSummary, ["AssertionFailedError", "expected:", "but was:", "Expected", "<<< FAILURE!"], 20),
        "Inspect the failing test case and update the related service/controller/DTO validation logic, or update the test only if the SRS expectation is incorrect."
      )
    );
  }

  if (sections.length) return sections.join("\n\n---\n\n");

  return buildGenericDiagnosis(
    { titleHint: "Backend Maven test failures" },
    rawSummary,
    "Backend test execution failed.",
    "Inspect the Maven Surefire/Failsafe reports, identify the failing test or Spring context error, then fix the related backend code or test configuration."
  );
}

function buildFrontendDiagnosis(rawSummary) {
  const sections = [];

  if (rawSummary.includes("@typescript-eslint/no-explicit-any")) {
    sections.push(
      bugSection(
        "Explicit `any` Types in TypeScript Code",
        "Multiple TypeScript files use `any`, but the ESLint rule `@typescript-eslint/no-explicit-any` forbids explicit `any`.",
        pickLines(rawSummary, ["@typescript-eslint/no-explicit-any", "Unexpected any"], 24),
        "Define proper request/response interfaces or use `unknown` with type narrowing instead of `any`."
      )
    );
  }

  if (rawSummary.includes("no-unused-vars")) {
    sections.push(
      bugSection(
        "Unused Variables",
        "Some variables are declared but never used, causing ESLint to fail.",
        pickLines(rawSummary, ["no-unused-vars", "defined but never used", "assigned a value but never used"], 24),
        "Remove unused variables or use them intentionally. If they are placeholders, rename only if the ESLint config allows ignored patterns."
      )
    );
  }

  if (rawSummary.includes("react-hooks/set-state-in-effect")) {
    sections.push(
      bugSection(
        "Synchronous State Updates Inside `useEffect`",
        "Some React components call `setState` synchronously inside `useEffect`, which violates the configured React Hooks lint rule.",
        pickLines(rawSummary, ["react-hooks/set-state-in-effect", "setState", "synchronously"], 24),
        "Move derived state to initialization, event handlers, memoized values, or guard the effect carefully."
      )
    );
  }

  if (rawSummary.includes("react-hooks/purity") || rawSummary.includes("Math.random")) {
    sections.push(
      bugSection(
        "Impure Function Called During Render",
        "A component calls an impure function such as `Math.random()` during render, making rendering non-idempotent.",
        pickLines(rawSummary, ["react-hooks/purity", "Math.random", "Cannot call impure function"], 24),
        "Generate random values outside render, memoize them with `useMemo`, or use deterministic placeholder values."
      )
    );
  }

  if (rawSummary.includes("react-refresh/only-export-components")) {
    sections.push(
      bugSection(
        "React Refresh Export Rule Violation",
        "A file exports non-component values together with components, which violates the React Refresh rule.",
        pickLines(rawSummary, ["react-refresh/only-export-components", "Fast refresh", "only export components"], 24),
        "Move constants, hooks, or helper functions into a separate file."
      )
    );
  }

  if (sections.length) return sections.join("\n\n---\n\n");

  return buildGenericDiagnosis(
    { titleHint: "Frontend lint/typecheck/build failures" },
    rawSummary,
    "Frontend lint, typecheck, or build failed.",
    "Inspect ESLint, TypeScript, and Vite build output, then fix the reported files or configuration."
  );
}

function buildPostmanDiagnosis(rawSummary) {
  const hasParsedFailure = rawSummary.includes("- Request:") || rawSummary.includes("Newman failures:");

  if (hasParsedFailure && !rawSummary.includes("No assertion failures found")) {
    return bugSection(
      "Postman/Newman API Test Failure",
      "One or more API requests/assertions failed in Newman.",
      pickLines(rawSummary, ["- Request:", "Test:", "Error:", "Assertion", "status"], 30),
      "Check the API response, status code, authentication token, environment variables, and Postman test script."
    );
  }

  return bugSection(
    "Postman/Newman Runtime Failure",
    "Newman failed without parsed assertion failures.",
    pickLines(rawSummary, ["No assertion failures", "network", "timeout", "ECONN", "collection", "baseUrl", "Error"], 30),
    "Check Render backend availability, cold start timeout, collection path, baseUrl, token variables, and network errors."
  );
}

function buildE2eDiagnosis(rawSummary) {
  return bugSection(
    "E2E Scenario Failure",
    "A CodeceptJS/Playwright scenario failed.",
    pickLines(rawSummary, ["Scenario", "Error", "Failed", "FAIL", "Timeout", "locator", "expected", "not found", "Cannot"], 30),
    "Check deployed frontend state, selector stability, test account data, API connectivity, and waiting strategy."
  );
}

function buildDockerDiagnosis(rawSummary) {
  return bugSection(
    "Docker Build Failure",
    "The backend Docker image failed to build.",
    pickLines(rawSummary, ["ERROR", "Error", "error", "failed", "FAIL", "Cannot", "not found", "no such file", "denied"], 30),
    "Check `backend/Dockerfile`, Maven build command, jar path, dependency download, and build context."
  );
}

function buildGenericDiagnosis(item, rawSummary, bugText = "A CI job failed.", suggestedFix = "Open the GitHub Actions logs and artifacts, identify the failing command, then fix code/test/config.") {
  return bugSection(
    item.titleHint || "CI Job Failure",
    bugText,
    pickLines(rawSummary, ["ERROR", "Error", "error", "failed", "FAIL", "Failure", "Exception", "expected"], 30),
    suggestedFix
  );
}

function buildDiagnosis(item, rawSummary) {
  if (item.category === "backend-test-failed") {
    return buildBackendDiagnosis(rawSummary);
  }

  if (item.category === "frontend-build-failed") {
    return buildFrontendDiagnosis(rawSummary);
  }

  if (item.category === "postman-api-test-failed") {
    return buildPostmanDiagnosis(rawSummary);
  }

  if (item.category === "e2e-test-failed") {
    return buildE2eDiagnosis(rawSummary);
  }

  if (item.category === "docker-build-failed") {
    return buildDockerDiagnosis(rawSummary);
  }

  return buildGenericDiagnosis(item, rawSummary);
}

function issueDescription(item, fingerprintLabel, diagnosis, rawSummary) {
  return [
    "## CI Failure Diagnosis",
    "",
    `Repository: \`${repository}\``,
    `Workflow: \`${workflow}\``,
    `Branch: \`${branch}\``,
    `Commit SHA: \`${sha}\``,
    `Actor: \`${actor}\``,
    `Failed job: \`${item.jobName}\``,
    `Failure category: \`${item.category}\``,
    `Fingerprint: \`${fingerprintLabel}\``,
    `GitHub Actions run: ${runUrl}`,
    "",
    "## Job Results",
    "",
    jobResultsText(),
    "",
    "## Identified Bugs to Fix",
    "",
    diagnosis,
    "",
    "## Raw Failure Summary",
    "",
    "```text",
    rawSummary,
    "```",
  ].join("\n");
}

function repeatFailureComment(item, fingerprintLabel, diagnosis, rawSummary) {
  return [
    "CI failed again with the same fingerprint.",
    "",
    `Repository: \`${repository}\``,
    `Branch: \`${branch}\``,
    `Commit: \`${sha}\``,
    `Actor: \`${actor}\``,
    `Failed job: \`${item.jobName}\``,
    `Failure category: \`${item.category}\``,
    `Fingerprint: \`${fingerprintLabel}\``,
    `GitHub Actions run: ${runUrl}`,
    "",
    "## Identified Bugs to Fix",
    "",
    diagnosis,
    "",
    "## Raw Failure Summary",
    "",
    "```text",
    rawSummary,
    "```",
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

async function addComment(issueKey, item, fingerprintLabel, diagnosis, rawSummary) {
  const response = await request("POST", `/rest/api/3/issue/${issueKey}/comment`, {
    body: adfText(repeatFailureComment(item, fingerprintLabel, diagnosis, rawSummary)),
  });

  if (response.status !== 201) {
    console.error(`Failed to comment on ${issueKey}. HTTP ${response.status}.`);
    console.error(JSON.stringify(response.body));
    process.exit(1);
  }

  console.log(`Commented on existing Jira issue: ${issueKey}`);
}

async function createIssue(issueType, item, fingerprint, diagnosis, rawSummary) {
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
    description: adfText(issueDescription(item, fingerprint.label, diagnosis, rawSummary)),
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
    return createIssue("Task", item, fingerprint, diagnosis, rawSummary);
  }

  console.error(`Failed to create Jira issue. HTTP ${response.status}.`);
  console.error(JSON.stringify(response.body));
  process.exit(1);
}

async function processFailureItem(item) {
  const fingerprint = createFingerprint(item.category);
  const rawSummary = readFailureSummaryForFile(item.summaryFile);
  const diagnosis = buildDiagnosis(item, rawSummary);

  console.log(`Processing failure item: ${item.category}`);
  console.log(`Fingerprint: ${fingerprint.label}`);

  const existing = await findExistingIssue(fingerprint.label);
  if (existing && existing.key) {
    await addComment(existing.key, item, fingerprint.label, diagnosis, rawSummary);
    return;
  }

  await createIssue(configuredIssueType, item, fingerprint, diagnosis, rawSummary);
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
