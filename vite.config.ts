import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { cpSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const git = (...args: string[]) =>
  execFileSync("git", args, { encoding: "utf8" }).trim();

const buildMetadataPlugin = (): Plugin => ({
  name: "drawmcp-build-metadata",
  generateBundle() {
    const manifestSource = readFileSync("public/evidence/latest.json", "utf8");
    const manifest = JSON.parse(manifestSource);
    const sourceCommit =
      process.env.VERCEL_GIT_COMMIT_SHA?.trim() || git("rev-parse", "HEAD");
    const metadata = {
      schema_version: 1,
      generated_at: new Date().toISOString(),
      source_commit: sourceCommit,
      source_tree_clean: git("status", "--porcelain") === "",
      release_manifest_source_commit: manifest.source_commit,
      release_manifest_sha256: createHash("sha256")
        .update(manifestSource)
        .digest("hex"),
      build_environment: process.env.VERCEL_ENV ?? "local",
    };
    this.emitFile({
      type: "asset",
      fileName: "release.json",
      source: `${JSON.stringify(metadata, null, 2)}\n`,
    });
  },
  closeBundle() {
    cpSync(
      resolve("node_modules/@excalidraw/excalidraw/dist/prod/fonts"),
      resolve("dist/fonts"),
      { recursive: true },
    );
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), buildMetadataPlugin()],
  optimizeDeps: {
    entries: ["index.html"],
  },
});
