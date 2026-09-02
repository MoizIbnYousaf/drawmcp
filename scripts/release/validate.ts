import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { createReleaseManifest } from "./create-manifest";

const run = (command: string, args: string[]) =>
  execFileSync(command, args, { cwd: process.cwd(), stdio: "inherit" });

run(resolve("node_modules/.bin/vitest"), [
  "run",
  "--reporter=json",
  "--outputFile=.evals/unit-tests.json",
]);
run("npm", ["run", "lint"]);
run("npm", ["run", "evals:check"]);
run("npm", ["run", "evals:deterministic"]);
run("npm", ["run", "evals:smoke"]);
run("npm", ["run", "evals:visual"]);
run("npm", ["run", "video:check"]);
run("npm", ["run", "build"]);
run("npm", ["audit", "--audit-level=high"]);
console.log(`Release validation passed. ${createReleaseManifest()}`);
