import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";
import puppeteer, { type Browser } from "puppeteer-core";
import { preview, type PreviewServer } from "vite";

const routes = ["/", "/docs", "/benchmarks"] as const;
const args = process.argv.slice(2);
const option = (name: string): string | undefined => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const externalUrl = option("--url");
const outputPath = resolve(
  option("--output") ?? ".evals/public-copy-latest.json",
);
const textOutputPath = outputPath.endsWith(".json")
  ? `${outputPath.slice(0, -5)}.txt`
  : `${outputPath}.txt`;

const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
const countWords = (value: string) =>
  value.length === 0 ? 0 : value.split(/\s+/).length;

let server: PreviewServer | undefined;
let browser: Browser | undefined;

const main = async () => {
  let baseUrl = externalUrl;
  if (!baseUrl) {
    server = await preview({
      logLevel: "error",
      preview: { host: "127.0.0.1", port: 0 },
    });
    const address = server.httpServer.address();
    if (!address || typeof address === "string") {
      throw new Error("Vite preview did not expose a copy-extraction port.");
    }
    baseUrl = `http://127.0.0.1:${address.port}`;
  }

  browser = await puppeteer.launch({
    browser: "chrome",
    channel: "chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const captured: Array<{ route: string; text: string; word_count: number }> = [];
  for (const route of routes) {
    const page = await browser.newPage();
    await page.goto(new URL(route, baseUrl).toString(), {
      waitUntil: "networkidle0",
      timeout: 30_000,
    });
    const text = normalize(
      await page.evaluate(() => document.querySelector("main")?.innerText ?? ""),
    );
    if (!text) throw new Error(`${route} produced no public copy.`);
    captured.push({ route, text, word_count: countWords(text) });
    await page.close();
  }

  const payload = captured.map(({ route, text }) => `${route}\n${text}`).join("\n\n");
  const fingerprint = createHash("sha256").update(payload).digest("hex");
  const report = {
    schema_version: 1,
    recorded_at: new Date().toISOString(),
    source: externalUrl ? "deployed-site" : "local-production-build",
    routes: captured,
    source_word_count: countWords(payload),
    sha256: fingerprint,
    payload,
  };
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(textOutputPath, `${payload}\n`);
  console.log(`Public copy: ${report.source_word_count} words.`);
  console.log(`SHA-256: ${fingerprint}`);
  console.log(`Report: ${outputPath}`);
  console.log(`Text: ${textOutputPath}`);
};

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await browser?.close().catch(() => undefined);
    await server?.httpServer.close();
  });
