import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";
import puppeteer, { type Browser, type Page } from "puppeteer-core";
import { createServer, type ViteDevServer } from "vite";
import { TIC_TAC_TOE_STORAGE_KEY } from "../../src/demos/tic-tac-toe";

type ToolHandle = {
  name: string;
  execute: (input: Record<string, unknown>) => Promise<{
    status: string;
    output?: unknown;
    errorText?: string;
  }>;
};

const args = process.argv.slice(2);
const option = (name: string): string | undefined => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const externalUrl = option("--url");
const outputPath = resolve(
  option("--output") ?? ".evals/tic-tac-toe-latest.json",
);

const getTools = (page: Page): ToolHandle[] =>
  (((page as unknown as { webmcp?: { tools?: () => ToolHandle[] } }).webmcp
    ?.tools?.() ?? []) as ToolHandle[]);

const waitForTools = async (page: Page) => {
  const started = Date.now();
  while (Date.now() - started < 10_000) {
    if (getTools(page).length === 7) return;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 25));
  }
  throw new Error("The tic-tac-toe page did not register seven tools.");
};

const callTool = async (
  page: Page,
  name: string,
  input: Record<string, unknown>,
) => {
  const tool = getTools(page).find((candidate) => candidate.name === name);
  if (!tool) throw new Error(`${name} is unavailable.`);
  const response = await tool.execute(input);
  if (response.status !== "Completed") {
    throw new Error(response.errorText ?? `${name} returned ${response.status}.`);
  }
  const output =
    typeof response.output === "string"
      ? JSON.parse(response.output)
      : response.output;
  if (!output?.ok) throw new Error(`${name} failed with ${output?.code}.`);
  return output as Record<string, any>;
};

const readCanvas = async (page: Page) => {
  const elements: Array<Record<string, any>> = [];
  let cursor: string | undefined;
  let revision = 0;
  do {
    const result = await callTool(page, "get_canvas_summary", {
      ...(cursor ? { cursor } : {}),
      limit: 8,
    });
    revision = Number(result.revision);
    elements.push(...(result.elements ?? []));
    cursor =
      typeof result.next_cursor === "string" ? result.next_cursor : undefined;
  } while (cursor);
  return { revision, elements };
};

const staticCanvasDigest = async (page: Page) =>
  page.evaluate(async () => {
    const canvas = document.querySelector<HTMLCanvasElement>(
      "canvas.excalidraw__canvas.static",
    );
    if (!canvas) return null;
    const bytes = new TextEncoder().encode(canvas.toDataURL());
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
  });

let vite: ViteDevServer | undefined;
let browser: Browser | undefined;
const consoleErrors: string[] = [];

const main = async () => {
  let targetUrl = externalUrl;
  if (!targetUrl) {
    vite = await createServer({
      logLevel: "error",
      server: { host: "127.0.0.1", port: 0 },
    });
    await vite.listen();
    const address = vite.httpServer?.address();
    if (!address || typeof address === "string") {
      throw new Error("Vite did not expose a tic-tac-toe test port.");
    }
    targetUrl = `http://127.0.0.1:${address.port}/canvas?demo=tic-tac-toe`;
  }

  browser = await puppeteer.launch({
    browser: "chrome",
    channel: "chrome",
    headless: true,
    args: ["--enable-features=WebMCP", "--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.evaluate((storageKey) => localStorage.removeItem(storageKey), TIC_TAC_TOE_STORAGE_KEY);
  await page.reload({ waitUntil: "domcontentloaded", timeout: 30_000 });
  await waitForTools(page);
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 500));

  const initial = await readCanvas(page);
  if (initial.elements.length !== 6) {
    throw new Error(`Expected six seeded board elements, found ${initial.elements.length}.`);
  }

  await page.keyboard.press("t");
  await page.mouse.click(540, 400);
  await page.keyboard.type("X");
  await page.keyboard.press("Escape");
  await page.keyboard.press("v");
  const afterHuman = await readCanvas(page);
  const humanMove = afterHuman.elements.find(
    (element) => element.type === "text" && element.text === "X",
  );
  if (!humanMove || humanMove.x < 180 || humanMove.x >= 360 || humanMove.y < 120 || humanMove.y >= 300) {
    throw new Error("The human UI move did not land in the top-left cell.");
  }

  const beforeAgentPixels = await staticCanvasDigest(page);
  const agentStarted = performance.now();
  const agentMove = await callTool(page, "add_elements", {
    expected_revision: afterHuman.revision,
    elements: [
      {
        id: "o_center",
        type: "ellipse",
        x: 390,
        y: 330,
        width: 120,
        height: 120,
        strokeColor: "#2724d1",
        strokeWidth: 4,
        backgroundColor: "#ffffff",
        fillStyle: "solid",
      },
    ],
  });
  const agentTurnMs = performance.now() - agentStarted;
  await page.keyboard.press("Escape");
  await page.mouse.click(1_100, 800);
  const afterAgentPixels = await staticCanvasDigest(page);
  const final = await readCanvas(page);
  const agentCircle = final.elements.find(
    (element) => element.id === "o_center" && element.type === "ellipse",
  );
  const visualChangeDetected =
    beforeAgentPixels !== null &&
    afterAgentPixels !== null &&
    beforeAgentPixels !== afterAgentPixels;
  const passed = Boolean(
    humanMove &&
      agentCircle &&
      final.revision > afterHuman.revision &&
      visualChangeDetected &&
      consoleErrors.length === 0,
  );
  await page.screenshot({
    path: resolve(dirname(outputPath), "tic-tac-toe-final.png"),
    fullPage: true,
  });
  const report = {
    schema_version: 1,
    recorded_at: new Date().toISOString(),
    target_url: targetUrl,
    human_move: {
      input: "Excalidraw keyboard and pointer",
      mark: "X",
      cell: "top-left",
      revision_after: afterHuman.revision,
    },
    agent_move: {
      protocol: "WebMCP",
      tool: "add_elements",
      mark: "O",
      cell: "center",
      duration_ms: agentTurnMs,
      receipt: agentMove,
    },
    final: {
      revision: final.revision,
      element_count: final.elements.length,
      human_move_present: Boolean(humanMove),
      agent_move_present: Boolean(agentCircle),
      visual_change_detected: visualChangeDetected,
    },
    console_errors: consoleErrors,
    passed,
  };
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Tic-tac-toe WebMCP proof: ${passed ? "passed" : "failed"}.`);
  console.log(`Agent move: ${agentTurnMs.toFixed(2)} ms.`);
  console.log(`Report: ${outputPath}`);
  if (!passed) process.exitCode = 1;
};

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await browser?.close().catch(() => undefined);
    await vite?.close().catch(() => undefined);
  });
