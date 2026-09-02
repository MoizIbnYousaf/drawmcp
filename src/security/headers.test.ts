import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("production security headers", () => {
  it("keeps WebMCP self-only and protects the static application", () => {
    const config = JSON.parse(readFileSync(resolve("vercel.json"), "utf8"));
    const headers = Object.fromEntries(
      config.headers[0].headers.map(
        ({ key, value }: { key: string; value: string }) => [key, value],
      ),
    );
    expect(headers["Permissions-Policy"]).toBe("tools=(self)");
    expect(headers["Content-Security-Policy"]).toContain("default-src 'self'");
    expect(headers["Content-Security-Policy"]).toContain("connect-src 'self'");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("no-referrer");
  });
});
