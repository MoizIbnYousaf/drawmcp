import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";
import puppeteer, { type Browser, type Page } from "puppeteer-core";
import { createServer, type ViteDevServer } from "vite";
import type { ProjectedSceneElement } from "../../evals/oracles/scene-oracle";

type DomainResult = Record<string, unknown> & { ok: boolean; code?: string };
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
  option("--output") ?? ".evals/shared-canvas-continuity-latest.json",
);

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isProjectedSceneElement = (
  value: unknown,
): value is ProjectedSceneElement =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.type === "string" &&
  typeof value.x === "number" &&
  typeof value.y === "number" &&
  typeof value.width === "number" &&
  typeof value.height === "number";

const getTools = (page: Page): ToolHandle[] =>
  (((page as unknown as { webmcp?: { tools?: () => ToolHandle[] } }).webmcp
    ?.tools?.() ?? []) as ToolHandle[]);

const waitForTools = async (page: Page): Promise<void> => {
  const started = Date.now();
  while (Date.now() - started < 10_000) {
    if (getTools(page).length === 7) return;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 25));
  }
  throw new Error("The shared canvas did not register seven WebMCP tools.");
};

const parseOutput = (output: unknown): DomainResult => {
  const parsed = typeof output === "string" ? JSON.parse(output) : output;
  assert(isRecord(parsed), "Tool output was not an object.");
  assert(typeof parsed.ok === "boolean", "Tool output omitted its ok field.");
  return { ...parsed, ok: parsed.ok };
};

const callTool = async (
  page: Page,
  name: string,
  input: Record<string, unknown> = {},
): Promise<DomainResult> => {
  const tool = getTools(page).find((candidate) => candidate.name === name);
  assert(tool, `${name} is unavailable.`);
  const response = await tool.execute(input);
  assert(
    response.status === "Completed",
    response.errorText ?? `${name} returned ${response.status}.`,
  );
  const output = parseOutput(response.output);
  assert(output.ok, `${name} failed with ${String(output.code)}.`);
  return output;
};

const readCanvas = async (page: Page) => {
  const elements: ProjectedSceneElement[] = [];
  let cursor: string | undefined;
  let revision = 0;
  do {
    const result = await callTool(page, "get_canvas_summary", {
      ...(cursor ? { cursor } : {}),
      limit: 8,
    });
    revision = Number(result.revision);
    const pageElements = result.elements;
    assert(Array.isArray(pageElements), "Canvas summary omitted its elements.");
    assert(
      pageElements.every(isProjectedSceneElement),
      "Canvas summary contained an invalid element projection.",
    );
    elements.push(...pageElements);
    cursor =
      typeof result.next_cursor === "string" ? result.next_cursor : undefined;
  } while (cursor);
  return { revision, elements };
};

const waitForCanvas = async (
  page: Page,
  predicate: (scene: Awaited<ReturnType<typeof readCanvas>>) => boolean,
) => {
  const started = Date.now();
  let latest = await readCanvas(page);
  while (Date.now() - started < 5_000) {
    if (predicate(latest)) return latest;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 50));
    latest = await readCanvas(page);
  }
  throw new Error(
    `Canvas state did not settle before the continuity timeout. Latest elements: ${latest.elements
      .map(({ id, type }) => `${id}:${type}`)
      .join(", ")}.`,
  );
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
    assert(
      address && typeof address !== "string",
      "Vite did not expose a continuity-test port.",
    );
    targetUrl = `http://127.0.0.1:${address.port}/canvas`;
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
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded", timeout: 30_000 });
  await waitForTools(page);
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 500));

  const initial = await readCanvas(page);
  assert(initial.elements.length === 0, "The continuity canvas was not empty.");

  await page.keyboard.press("r");
  await page.mouse.move(420, 320);
  await page.mouse.down();
  await page.mouse.move(560, 410, { steps: 8 });
  await page.mouse.up();
  await page.keyboard.press("Escape");
  await page.keyboard.press("v");
  const afterHuman = await waitForCanvas(page, (scene) =>
    scene.elements.some((element) => element.type === "rectangle"),
  );
  const humanElement = afterHuman.elements.find(
    (element) => element.type === "rectangle",
  );
  assert(humanElement, "The human editor change was not visible through WebMCP.");
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 1_000));

  const beforeAgentPixels = await staticCanvasDigest(page);
  const agentStarted = performance.now();
  const agentReceipt = await callTool(page, "add_elements", {
    expected_revision: afterHuman.revision,
    elements: [
      {
        id: "agent_response",
        type: "rectangle",
        x: 650,
        y: 360,
        width: 240,
        height: 120,
        strokeColor: "#2f9e44",
        backgroundColor: "#dff5e4",
        fillStyle: "solid",
        label: { text: "Agent response" },
      },
    ],
  });
  const agentTurnMs = performance.now() - agentStarted;
  const afterAgentPixels = await staticCanvasDigest(page);
  const afterAgent = await waitForCanvas(page, (scene) =>
    scene.elements.some((element) => element.id === "agent_response"),
  );
  const renderedBeforeReturn =
    beforeAgentPixels !== null &&
    afterAgentPixels !== null &&
    beforeAgentPixels !== afterAgentPixels;
  assert(renderedBeforeReturn, "The agent change did not alter rendered pixels.");
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 1_000));

  await page.keyboard.press("Escape");
  const undoDisabled = await page.$eval(
    '[data-testid="button-undo"]',
    (button) =>
      button instanceof HTMLButtonElement ? button.disabled : true,
  );
  assert(!undoDisabled, "Native Undo was unavailable after the agent edit.");
  await page.click('[data-testid="button-undo"]');
  const afterUndo = await waitForCanvas(page, (scene) =>
    !scene.elements.some((element) => element.id === "agent_response"),
  );
  assert(
    afterUndo.elements.some((element) => element.id === humanElement.id),
    "Undo removed the human edit with the agent edit.",
  );
  const redoDisabled = await page.$eval(
    '[data-testid="button-redo"]',
    (button) =>
      button instanceof HTMLButtonElement ? button.disabled : true,
  );
  assert(!redoDisabled, "Native Redo was unavailable after Undo.");
  await page.click('[data-testid="button-redo"]');
  const afterRedo = await waitForCanvas(page, (scene) =>
    scene.elements.some((element) => element.id === "agent_response"),
  );
  const fitReceipt = await callTool(page, "fit_to_content", { scope: "all" });

  const checks = {
    seven_tools_registered: getTools(page).length === 7,
    human_edit_read_by_agent: Boolean(humanElement),
    agent_edit_present: afterAgent.elements.some(
      (element) => element.id === "agent_response",
    ),
    rendered_before_return: renderedBeforeReturn,
    fit_completed: fitReceipt.ok,
    undo_preserved_human_edit: afterUndo.elements.some(
      (element) => element.id === humanElement.id,
    ),
    undo_removed_agent_edit: !afterUndo.elements.some(
      (element) => element.id === "agent_response",
    ),
    redo_restored_agent_edit: afterRedo.elements.some(
      (element) => element.id === "agent_response",
    ),
    no_console_errors: consoleErrors.length === 0,
  };
  const passed = Object.values(checks).every(Boolean);
  mkdirSync(dirname(outputPath), { recursive: true });
  const screenshotPath = resolve(
    dirname(outputPath),
    "shared-canvas-continuity-final.png",
  );
  await page.screenshot({ path: screenshotPath, fullPage: true });
  const report = {
    schema_version: 1,
    recorded_at: new Date().toISOString(),
    target_url: targetUrl,
    workflow: "human editor change -> WebMCP read -> agent add -> fit -> undo -> redo",
    human_edit: {
      input: "Excalidraw keyboard and pointer",
      id: humanElement.id,
      type: humanElement.type,
      revision_after: afterHuman.revision,
    },
    agent_edit: {
      protocol: "WebMCP",
      tools: ["add_elements", "fit_to_content"],
      id: "agent_response",
      duration_ms: agentTurnMs,
      add_receipt: agentReceipt,
      fit_receipt: fitReceipt,
      revision_after: afterAgent.revision,
    },
    history: {
      revision_after_undo: afterUndo.revision,
      revision_after_redo: afterRedo.revision,
    },
    checks,
    console_errors: consoleErrors,
    screenshot: screenshotPath,
    passed,
  };
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Shared-canvas continuity proof: ${passed ? "passed" : "failed"}.`);
  console.log(`Human + agent turn: ${agentTurnMs.toFixed(2)} ms.`);
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
