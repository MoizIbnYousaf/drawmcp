import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { verifyLiveBenchmark } from "../../benchmarks/verify";

const requestedPath = process.argv[2];
const sourcePath = requestedPath
  ? resolve(requestedPath)
  : (() => {
      const summary = JSON.parse(
        readFileSync(resolve("public/benchmarks/live-latest.json"), "utf8"),
      ) as { raw?: { path?: string } };
      if (!summary.raw?.path) {
        throw new Error("Accepted live benchmark summary omitted its raw path.");
      }
      return resolve(`public${summary.raw.path}`);
    })();
const result = verifyLiveBenchmark(
  JSON.parse(readFileSync(sourcePath, "utf8")),
);
if (!result.ok) {
  throw new Error(`Live benchmark verification failed: ${result.errors.join(" ")}`);
}
console.log(`Live benchmark verification passed: ${sourcePath}`);
