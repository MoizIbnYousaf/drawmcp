import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
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
run("npm", ["run", "evals:tic-tac-toe"]);
run("npm", ["run", "evals:visual"]);
run("npm", ["run", "video:check"]);
run("npm", ["run", "build"]);
run("npm", ["run", "evals:csp"]);
const buildMetadata = JSON.parse(readFileSync(resolve("dist/release.json"), "utf8"));
const manifestSource = readFileSync(resolve("public/evidence/latest.json"), "utf8");
const manifest = JSON.parse(manifestSource);
const head = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
if (
  buildMetadata.source_commit !== head ||
  buildMetadata.source_tree_clean !== true ||
  buildMetadata.release_manifest_source_commit !== manifest.source_commit ||
  buildMetadata.release_manifest_sha256 !==
    createHash("sha256").update(manifestSource).digest("hex")
) {
  throw new Error("Build metadata did not match the clean release candidate.");
}
console.log(`Build metadata verified for ${head}.`);
run("npm", ["audit", "--audit-level=high"]);
console.log(`Release validation passed. ${createReleaseManifest()}`);
