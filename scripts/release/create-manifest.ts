import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const readJson = (path: string) => JSON.parse(readFileSync(resolve(path), "utf8"));
const git = (...args: string[]) =>
  execFileSync("git", args, { encoding: "utf8" }).trim();

export const createReleaseManifest = () => {
  if (git("status", "--porcelain")) {
    throw new Error("Release evidence must be generated from a clean tree.");
  }
  const unit = readJson(".evals/unit-tests.json");
  const deterministic = readJson(".evals/deterministic-latest.json");
  const cspDeterministic = readJson(".evals/csp-deterministic-latest.json");
  const smoke = readJson(".evals/smoke-latest.json");
  const continuity = readJson(".evals/shared-canvas-continuity-latest.json");
  const visual = readJson(".evals/visual-qa-latest.json");
  const benchmark = readJson("public/benchmarks/latest.json");
  const liveBenchmark = readJson("public/benchmarks/live-latest.json");
  const evalRun = readdirSync(resolve("evidence/evals"), {
    withFileTypes: true,
  })
    .filter((entry) => entry.isDirectory())
    .map(({ name }) => name)
    .sort()
    .at(-1);
  if (!evalRun) throw new Error("No accepted probabilistic eval evidence exists.");
  const probabilistic = readJson(`evidence/evals/${evalRun}/summary.json`);
  const tools = readJson("evals/tools.json");
  if (
    unit.success !== true ||
    deterministic.passed !== true ||
    cspDeterministic.passed !== true ||
    smoke.passed !== true ||
    continuity.passed !== true ||
    visual.passed !== true ||
    probabilistic.passed !== true ||
    benchmark.counts?.semantic_failures !== 0 ||
    liveBenchmark.counts?.semantic_successes !==
      liveBenchmark.counts?.total_trials ||
    liveBenchmark.counts?.rendered_webmcp_successes !==
      liveBenchmark.counts?.pairs
  ) {
    throw new Error("One or more release evidence inputs did not pass.");
  }

  const commit = git("rev-parse", "HEAD");
  const evidence = {
    tools: { passed: tools.tools.length, total: tools.tools.length },
    deterministic_browser: {
      passed: deterministic.steps.filter(
        (step: { passed: boolean }) => step.passed,
      ).length,
      total: deterministic.steps.length,
    },
    csp_production_build: {
      passed: cspDeterministic.steps.filter(
        (step: { passed: boolean }) => step.passed,
      ).length,
      total: cspDeterministic.steps.length,
    },
    local_model: {
      passed: Object.values(probabilistic.categories).reduce(
        (total: number, category: any) => total + category.passes,
        0,
      ),
      total: Object.values(probabilistic.categories).reduce(
        (total: number, category: any) => total + category.attempts,
        0,
      ),
    },
    chrome_smoke: {
      passed: smoke.passed_steps,
      total: smoke.total_steps,
    },
    shared_canvas_continuity: { passed: 1, total: 1 },
    visual_routes: {
      passed: visual.passed_cases,
      total: visual.total_cases,
    },
    unit_tests: {
      passed: unit.numPassedTests,
      total: unit.numTotalTests,
    },
    controlled_benchmark: {
      semantic_passed:
        benchmark.counts.total_trials - benchmark.counts.semantic_failures,
      total: benchmark.counts.total_trials,
    },
    live_benchmark: {
      semantic_passed: liveBenchmark.counts.semantic_successes,
      total: liveBenchmark.counts.total_trials,
      rendered_webmcp: liveBenchmark.counts.rendered_webmcp_successes,
      pairs: liveBenchmark.counts.pairs,
      p50_speedup: liveBenchmark.comparison.p50.webmcp_speedup,
    },
  };
  const assertClaims = (path: string, claims: string[]) => {
    const source = readFileSync(resolve(path), "utf8").replace(/\s+/g, " ");
    for (const claim of claims) {
      if (!source.includes(claim)) {
        throw new Error(`${path} is missing the release claim: ${claim}`);
      }
    }
  };
  assertClaims("README.md", [
    `${evidence.unit_tests.passed} deterministic tests`,
    `${evidence.deterministic_browser.passed}/${evidence.deterministic_browser.total} project-owned browser proof steps`,
    `${evidence.chrome_smoke.passed}/${evidence.chrome_smoke.total} authored smoke calls`,
    `${evidence.local_model.passed}/${evidence.local_model.total} repeated local-model decisions`,
    `${evidence.controlled_benchmark.semantic_passed}/${evidence.controlled_benchmark.total} semantically correct trials`,
  ]);
  assertClaims("docs/DEVPOST_SUBMISSION.md", [
    `${evidence.unit_tests.passed} deterministic tests`,
    `${evidence.deterministic_browser.passed}/${evidence.deterministic_browser.total} semantic browser steps`,
    `${evidence.chrome_smoke.passed}/${evidence.chrome_smoke.total} Chrome Labs smoke calls`,
    `${evidence.local_model.passed} local-model decisions`,
  ]);
  const releaseRoot = resolve("evidence/releases", commit);
  mkdirSync(releaseRoot, { recursive: true });
  const writeReleaseJson = (name: string, value: unknown) => {
    writeFileSync(
      resolve(releaseRoot, name),
      `${JSON.stringify(value, null, 2)}\n`,
    );
    return `evidence/releases/${commit}/${name}`;
  };
  const unitArtifact = writeReleaseJson("unit-tests.json", {
    schema_version: 1,
    recorded_at: new Date(unit.startTime).toISOString(),
    runner: "vitest",
    passed: unit.success === true,
    passed_tests: unit.numPassedTests,
    total_tests: unit.numTotalTests,
    failed_tests: unit.numFailedTests,
    pending_tests: unit.numPendingTests,
  });
  const deterministicArtifact = writeReleaseJson(
    "deterministic-browser.json",
    deterministic,
  );
  const cspArtifact = writeReleaseJson(
    "csp-production-build.json",
    cspDeterministic,
  );
  const smokeArtifact = writeReleaseJson("chrome-smoke.json", smoke);
  const continuityArtifact = writeReleaseJson(
    "shared-canvas-continuity.json",
    continuity,
  );
  const visualArtifact = writeReleaseJson("visual-qa.json", {
    ...visual,
    cases: visual.cases.map(
      ({ screenshot: _localScreenshot, ...testCase }: Record<string, unknown>) =>
        testCase,
    ),
  });
  const manifest = {
    schema_version: 2,
    generated_at: new Date().toISOString(),
    source_commit: commit,
    source_tree_clean: true,
    proof: evidence,
    artifacts: {
      unit_tests: unitArtifact,
      deterministic_browser: deterministicArtifact,
      csp_production_build: cspArtifact,
      chrome_smoke: smokeArtifact,
      shared_canvas_continuity: continuityArtifact,
      visual_qa: visualArtifact,
      probabilistic: `evidence/evals/${evalRun}/summary.json`,
      benchmark: "public/benchmarks/latest.json",
      live_benchmark: "public/benchmarks/live-latest.json",
    },
    production: {
      status: "pending-deployment-verification",
      deployment_id: null,
      deployed_commit: null,
    },
  };
  const manifestSource = `${JSON.stringify(manifest, null, 2)}\n`;
  writeFileSync(resolve(releaseRoot, "manifest.json"), manifestSource);
  mkdirSync(resolve("public/evidence"), { recursive: true });
  writeFileSync(resolve("public/evidence/latest.json"), manifestSource);
  mkdirSync(resolve("src/data"), { recursive: true });
  writeFileSync(
    resolve("src/data/release-evidence.ts"),
    `// Generated by scripts/release/create-manifest.ts.\nexport const releaseEvidence = ${JSON.stringify(evidence, null, 2)} as const;\n`,
  );
  return resolve(releaseRoot, "manifest.json");
};

if (resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`Release manifest: ${createReleaseManifest()}`);
}
