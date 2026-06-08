const fs = require("fs");

const REPORT_FILES = [
  { name: "Admin API", file: "./postman-reports/summary-admin.json" },
  { name: "Clinic API", file: "./postman-reports/summary-clinic.json" },
  { name: "Doctor API", file: "./postman-reports/summary-doctor.json" },
  { name: "Patient API", file: "./postman-reports/summary-patient.json" },
];

let runtimeFailed = false;
let totalFailures = 0;

if (process.env.DEPLOY_STEP_OUTCOME === "failure") {
  console.error("Render deploy wait failed or timed out.");
  runtimeFailed = true;
}

if (process.env.HEALTH_STEP_OUTCOME === "failure") {
  console.error("Backend health check failed.");
  runtimeFailed = true;
}

for (const item of REPORT_FILES) {
  if (!fs.existsSync(item.file)) {
    console.warn(`Report not found, skipping: ${item.file}`);
    continue;
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(item.file, "utf8"));
  } catch (err) {
    console.error(`Invalid JSON report for ${item.name}: ${err.message}`);
    process.exitCode = 1;
    continue;
  }

  const failureCount = data?.run?.failures?.length ?? 0;
  if (failureCount > 0) {
    console.error(`${item.name} failed assertions: ${failureCount}`);
    totalFailures += failureCount;
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

if (runtimeFailed || totalFailures > 0) {
  if (totalFailures > 0) {
    console.error(`API tests failed with ${totalFailures} failed assertion(s).`);
  }
  process.exit(1);
}

console.log("Deploy, health check, and API tests passed.");
