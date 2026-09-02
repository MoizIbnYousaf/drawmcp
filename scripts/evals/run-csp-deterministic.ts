import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { preview, type PreviewServer } from "vite";
import { productionHeaders } from "./production-headers";

const execute = promisify(execFile);
const outputPath = resolve(".evals/csp-deterministic-latest.json");
let server: PreviewServer | undefined;

try {
  server = await preview({
    logLevel: "error",
    preview: {
      host: "127.0.0.1",
      port: 0,
      headers: productionHeaders,
    },
  });
  const address = server.httpServer.address();
  if (!address || typeof address === "string") {
    throw new Error("CSP preview server did not expose a port.");
  }
  const url = `http://127.0.0.1:${address.port}/canvas`;
  const { stdout, stderr } = await execute(
    "npx",
    [
      "-y",
      "tsx@4.23.13",
      "scripts/evals/run-deterministic.ts",
      "--url",
      url,
      "--output",
      outputPath,
    ],
    { maxBuffer: 10 * 1024 * 1024 },
  );
  process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
  const report = JSON.parse(readFileSync(outputPath, "utf8"));
  if (report.passed !== true || report.console_errors.length !== 0) {
    throw new Error("The production build failed deterministic CSP validation.");
  }
  console.log("Production-build CSP proof passed.");
} finally {
  await server?.close();
}
