import { execFile } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import { createServer } from "vite";

const execute = promisify(execFile);
const outputPath = resolve(".evals/smoke-latest.json");
const evals = JSON.parse(
  readFileSync(resolve("evals/webmcp-evals.json"), "utf8"),
) as Array<{ expectedCall?: unknown[] }>;
const countCalls = (nodes: unknown[]): number =>
  nodes.reduce((total, node) => {
    if (!node || typeof node !== "object") return total;
    const value = node as Record<string, unknown>;
    if (value.optional === true) return total;
    if (Array.isArray(value.ordered)) return total + countCalls(value.ordered);
    if (Array.isArray(value.unordered)) return total + countCalls(value.unordered);
    return total + (typeof value.functionName === "string" ? 1 : 0);
  }, 0);
const expectedSteps = evals.reduce(
  (total, test) => total + countCalls(test.expectedCall ?? []),
  0,
);

const server = await createServer({
  logLevel: "error",
  server: { host: "127.0.0.1", port: 0 },
});
try {
  await server.listen();
  const address = server.httpServer?.address();
  if (!address || typeof address === "string") {
    throw new Error("Smoke server did not expose a port.");
  }
  const url = `http://127.0.0.1:${address.port}/canvas`;
  const { stdout, stderr } = await execute(
    resolve("node_modules/.bin/webmcp-evals"),
    [
      "smoke",
      "-u",
      url,
      "-e",
      resolve("evals/webmcp-evals.json"),
      "--chrome-channel",
      "chrome",
    ],
    { maxBuffer: 10 * 1024 * 1024 },
  );
  const match = stdout.match(/Passed steps:\s*(\d+)\/(\d+)\s+across\s+(\d+)/);
  if (!match) throw new Error(`Could not parse smoke result. ${stderr}`);
  const passedSteps = Number(match[1]);
  const totalSteps = Number(match[2]);
  const cases = Number(match[3]);
  const report = {
    schema_version: 1,
    recorded_at: new Date().toISOString(),
    runner: "webmcp-evals@0.0.4",
    target: "isolated-local-vite",
    cases,
    passed_steps: passedSteps,
    total_steps: totalSteps,
    expected_steps: expectedSteps,
    passed:
      passedSteps === totalSteps && totalSteps === expectedSteps && cases === evals.length,
  };
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  if (!report.passed) throw new Error("Chrome Labs smoke counts did not match.");
  console.log(`Chrome Labs smoke: ${passedSteps}/${totalSteps} across ${cases} cases.`);
  console.log(`Report: ${outputPath}`);
} finally {
  await server.close();
}
