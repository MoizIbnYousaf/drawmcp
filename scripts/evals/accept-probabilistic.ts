import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const requestedSummary = process.argv[2];
if (!requestedSummary) {
  throw new Error("Pass the ignored probabilistic summary path to accept.");
}
const sourceSummaryPath = resolve(requestedSummary);
const sourceRoot = resolve(sourceSummaryPath, "..");
const summary = JSON.parse(readFileSync(sourceSummaryPath, "utf8")) as {
  run_id: string;
  reports: Record<string, string>;
  passed: boolean;
  [key: string]: unknown;
};
if (!summary.passed) throw new Error("Only a passing eval run can be accepted.");

const outputRoot = resolve("evidence/evals", summary.run_id);
mkdirSync(outputRoot, { recursive: true });
const sanitize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sanitize);
  if (typeof value === "string") {
    return value.replaceAll(`${process.cwd()}/`, "");
  }
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== "outputDir")
      .map(([key, item]) => [key, sanitize(item)]),
  );
};

const acceptedReports: Record<string, string> = {};
for (const [category, reportPath] of Object.entries(summary.reports)) {
  const report = JSON.parse(readFileSync(resolve(reportPath), "utf8"));
  const acceptedPath = resolve(outputRoot, `${category}.json`);
  writeFileSync(acceptedPath, `${JSON.stringify(sanitize(report), null, 2)}\n`);
  acceptedReports[category] = acceptedPath.replace(`${process.cwd()}/`, "");
}

for (const file of ["schema-manifest.json", "tools-model-ollama.json"]) {
  const value = JSON.parse(readFileSync(resolve(sourceRoot, file), "utf8"));
  writeFileSync(
    resolve(outputRoot, file),
    `${JSON.stringify(sanitize(value), null, 2)}\n`,
  );
}

const acceptedSummary = {
  ...sanitize(summary),
  reports: acceptedReports,
  evidence_class: "local-model-probabilistic",
  judged_host: false,
};
const acceptedSummaryPath = resolve(outputRoot, "summary.json");
writeFileSync(
  acceptedSummaryPath,
  `${JSON.stringify(acceptedSummary, null, 2)}\n`,
);
console.log(`Accepted probabilistic eval evidence: ${acceptedSummaryPath}`);
