import { execFile } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import { createServer, type ViteDevServer } from "vite";

const execute = promisify(execFile);

type SmokeOptions = {
  outputPath: string;
  target: string;
  url?: string;
};

const countCalls = (nodes: unknown[]): number =>
  nodes.reduce((total, node) => {
    if (!node || typeof node !== "object") return total;
    const value = node as Record<string, unknown>;
    if (value.optional === true) return total;
    if (Array.isArray(value.ordered)) return total + countCalls(value.ordered);
    if (Array.isArray(value.unordered)) return total + countCalls(value.unordered);
    return total + (typeof value.functionName === "string" ? 1 : 0);
  }, 0);

export const runSmoke = async ({ outputPath, target, url }: SmokeOptions) => {
  const evalPath = resolve("evals/webmcp-evals.json");
  const evals = JSON.parse(readFileSync(evalPath, "utf8")) as Array<{
    expectedCall?: unknown[];
  }>;
  const expectedSteps = evals.reduce(
    (total, test) => total + countCalls(test.expectedCall ?? []),
    0,
  );
  let server: ViteDevServer | undefined;
  let targetUrl = url;

  try {
    if (!targetUrl) {
      server = await createServer({
        logLevel: "error",
        server: { host: "127.0.0.1", port: 0 },
      });
      await server.listen();
      const address = server.httpServer?.address();
      if (!address || typeof address === "string") {
        throw new Error("Smoke server did not expose a port.");
      }
      targetUrl = `http://127.0.0.1:${address.port}/canvas`;
    }

    const { stdout, stderr } = await execute(
      resolve("node_modules/.bin/webmcp-evals"),
      [
        "smoke",
        "-u",
        targetUrl,
        "-e",
        evalPath,
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
      target,
      target_url: targetUrl,
      cases,
      passed_steps: passedSteps,
      total_steps: totalSteps,
      expected_steps: expectedSteps,
      passed:
        passedSteps === totalSteps &&
        totalSteps === expectedSteps &&
        cases === evals.length,
    };
    const resolvedOutput = resolve(outputPath);
    mkdirSync(dirname(resolvedOutput), { recursive: true });
    writeFileSync(resolvedOutput, `${JSON.stringify(report, null, 2)}\n`);
    if (!report.passed) throw new Error("Chrome Labs smoke counts did not match.");
    console.log(
      `Chrome Labs smoke: ${passedSteps}/${totalSteps} across ${cases} cases.`,
    );
    console.log(`Report: ${resolvedOutput}`);
    return report;
  } finally {
    await server?.close();
  }
};
