import puppeteer, { type Browser, type BrowserContext, type Page } from "puppeteer-core";
import { createServer, type ViteDevServer } from "vite";
import {
  evaluateScene,
  type ProjectedSceneElement,
  type SceneExpectation,
} from "../../evals/oracles/scene-oracle";

type Scenario = {
  webmcp_elements: Array<Record<string, unknown>>;
  expected_scene: SceneExpectation;
};

type ToolHandle = {
  name: string;
  execute: (input: Record<string, unknown>) => Promise<{
    status: string;
    output?: unknown;
    errorText?: string;
  }>;
};

const parseOutput = (output: unknown) =>
  (typeof output === "string" ? JSON.parse(output) : output) as Record<
    string,
    unknown
  > & { ok: boolean; code?: string };

const toolsFor = (page: Page): ToolHandle[] =>
  (((page as unknown as { webmcp?: { tools?: () => ToolHandle[] } }).webmcp
    ?.tools?.() ?? []) as ToolHandle[]);

const waitForTools = async (page: Page) => {
  const started = Date.now();
  while (Date.now() - started < 10_000) {
    const tools = toolsFor(page);
    if (tools.length === 7) return;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 25));
  }
  throw new Error("WebMCP benchmark page did not register seven tools.");
};

const callTool = async (
  page: Page,
  name: string,
  input: Record<string, unknown>,
) => {
  const tool = toolsFor(page).find((candidate) => candidate.name === name);
  if (!tool) throw new Error(`WebMCP tool ${name} is unavailable.`);
  const result = await tool.execute(input);
  if (result.status !== "Completed") {
    throw new Error(result.errorText ?? `${name} returned ${result.status}.`);
  }
  const output = parseOutput(result.output);
  if (!output.ok) throw new Error(`${name} failed with ${output.code}.`);
  return output;
};

const readCanvas = async (page: Page) => {
  const elements: ProjectedSceneElement[] = [];
  let cursor: string | undefined;
  do {
    const output = await callTool(page, "get_canvas_summary", {
      ...(cursor ? { cursor } : {}),
      limit: 8,
    });
    elements.push(...((output.elements ?? []) as ProjectedSceneElement[]));
    cursor =
      typeof output.next_cursor === "string" ? output.next_cursor : undefined;
  } while (cursor);
  return elements;
};

export class WebMcpLane {
  private vite?: ViteDevServer;
  private browser?: Browser;
  private context?: BrowserContext;
  private page?: Page;
  private targetUrl?: string;

  constructor(private readonly configuredTargetUrl?: string) {}

  async start(): Promise<void> {
    if (this.configuredTargetUrl) {
      this.targetUrl = this.configuredTargetUrl;
    } else {
      this.vite = await createServer({
        logLevel: "error",
        server: { host: "127.0.0.1", port: 0 },
      });
      await this.vite.listen();
      const address = this.vite.httpServer?.address();
      if (!address || typeof address === "string") {
        throw new Error("Vite benchmark server did not expose a port.");
      }
      this.targetUrl = `http://127.0.0.1:${address.port}/canvas`;
    }
    this.browser = await puppeteer.launch({
      browser: "chrome",
      channel: "chrome",
      headless: true,
      args: ["--enable-features=WebMCP", "--no-sandbox", "--disable-setuid-sandbox"],
    });
    this.context = await this.browser.createBrowserContext();
    this.page = await this.context.newPage();
    await this.preparePage(this.page);
  }

  async stop(): Promise<void> {
    await this.context?.close().catch(() => undefined);
    await this.browser?.close().catch(() => undefined);
    await this.vite?.close().catch(() => undefined);
    this.page = undefined;
    this.context = undefined;
    this.browser = undefined;
    this.vite = undefined;
  }

  async chromeVersion(): Promise<string> {
    return (await this.browser?.version()) ?? "unknown";
  }

  async runWarmTask(scenario: Scenario) {
    if (!this.page) throw new Error("WebMCP lane is not running.");
    await this.page.evaluate(() => localStorage.clear());
    await this.page.reload({ waitUntil: "domcontentloaded", timeout: 30_000 });
    await waitForTools(this.page);
    return this.executeTask(this.page, scenario, false);
  }

  async runColdTask(scenario: Scenario) {
    if (!this.browser || !this.targetUrl) {
      throw new Error("WebMCP lane is not running.");
    }
    const context = await this.browser.createBrowserContext();
    const page = await context.newPage();
    const started = performance.now();
    try {
      await page.goto(this.targetUrl, {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });
      await waitForTools(page);
      const result = await this.executeTask(page, scenario, true);
      return { ...result, task_duration_ms: performance.now() - started };
    } finally {
      await context.close();
    }
  }

  private async preparePage(page: Page) {
    if (!this.targetUrl) throw new Error("WebMCP target URL is unavailable.");
    await page.goto(this.targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "domcontentloaded", timeout: 30_000 });
    await waitForTools(page);
  }

  private async executeTask(page: Page, scenario: Scenario, coldStart: boolean) {
    await page.evaluate(() => performance.clearMeasures());
    const addInput = {
      expected_revision: 0,
      elements: scenario.webmcp_elements,
    };
    const fitInput = { scope: "all" };
    const started = performance.now();
    const addResult = await callTool(page, "add_elements", addInput);
    const fitResult = await callTool(page, "fit_to_content", fitInput);
    const taskDuration = performance.now() - started;
    const measures = await page.evaluate(() =>
      performance
        .getEntriesByType("measure")
        .filter((entry) => entry.name.startsWith("drawmcp:"))
        .map((entry) => ({ name: entry.name, duration_ms: entry.duration })),
    );
    const elements = await readCanvas(page);
    const evaluation = evaluateScene(elements, scenario.expected_scene);
    return {
      completed: true,
      semantic_pass: evaluation.ok,
      task_duration_ms: taskDuration,
      component_duration_ms: measures.reduce(
        (total, measure) => total + measure.duration_ms,
        0,
      ),
      cold_start: coldStart,
      tool_calls: 2,
      input_bytes:
        Buffer.byteLength(JSON.stringify(addInput)) +
        Buffer.byteLength(JSON.stringify(fitInput)),
      output_bytes:
        Buffer.byteLength(JSON.stringify(addResult)) +
        Buffer.byteLength(JSON.stringify(fitResult)),
      semantic_evaluation: evaluation,
      measures,
    };
  }
}
