import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { verifyBenchmark } from "../../benchmarks/verify";

const requestedPath = process.argv[2];
const path = requestedPath
  ? resolve(requestedPath)
  : (() => {
      const latest = JSON.parse(
        readFileSync(resolve("public/benchmarks/latest.json"), "utf8"),
      );
      if (typeof latest.raw?.path !== "string") {
        throw new Error("The accepted benchmark does not declare a raw path.");
      }
      return resolve(`public${latest.raw.path}`);
    })();
const result = verifyBenchmark(JSON.parse(readFileSync(path, "utf8")));
if (!result.ok) {
  console.error(result.errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Benchmark verification passed: ${path}`);
}
