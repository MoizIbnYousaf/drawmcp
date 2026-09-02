import { readFileSync } from "node:fs";
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
});
