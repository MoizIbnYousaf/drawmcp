import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { releaseEvidence } from "./release-evidence";

describe("release evidence", () => {
  it("keeps the generated site proof equal to the public manifest", () => {
    const manifest = JSON.parse(
      readFileSync(resolve("public/evidence/latest.json"), "utf8"),
    );
    expect(releaseEvidence).toEqual(manifest.proof);
  });

  it("keeps every published artifact reference durable and reviewable", () => {
    const manifest = JSON.parse(
      readFileSync(resolve("public/evidence/latest.json"), "utf8"),
    );
    for (const artifact of Object.values(manifest.artifacts) as string[]) {
      expect(artifact.startsWith(".evals/")).toBe(false);
      expect(existsSync(resolve(artifact)), artifact).toBe(true);
    }
  });
});
