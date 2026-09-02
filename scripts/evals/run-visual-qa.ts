import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import puppeteer, { type Browser, type Page } from "puppeteer-core";
import { createServer, type ViteDevServer } from "vite";

type VisualCase = {
  name: string;
  path: string;
  width: number;
  height: number;
  heading: string;
  canvas?: boolean;
};

const cases: VisualCase[] = [
  {
    name: "home-desktop",
    path: "/",
    width: 1440,
    height: 1000,
    heading: "You draw. The agent answers on the same canvas.",
  },
  {
    name: "docs-desktop",
    path: "/docs",
    width: 1440,
    height: 1000,
    heading: "One canvas, available to people and agents.",
  },
  {
    name: "benchmarks-desktop",
    path: "/benchmarks",
    width: 1440,
    height: 1000,
    heading: "WebMCP was 6.58× faster.",
  },
  {
    name: "canvas-desktop",
    path: "/canvas",
    width: 1440,
    height: 1000,
    heading: "DrawMCP",
    canvas: true,
  },
  {
    name: "retired-game-query-desktop",
    path: "/canvas?demo=tic-tac-toe",
    width: 1440,
    height: 1000,
    heading: "DrawMCP",
    canvas: true,
  },
  {
    name: "home-mobile",
    path: "/",
    width: 390,
    height: 844,
    heading: "You draw. The agent answers on the same canvas.",
  },
  {
    name: "docs-mobile",
    path: "/docs",
    width: 390,
    height: 844,
    heading: "One canvas, available to people and agents.",
  },
  {
    name: "benchmarks-mobile",
    path: "/benchmarks",
    width: 390,
    height: 844,
    heading: "WebMCP was 6.58× faster.",
  },
  {
    name: "canvas-mobile",
    path: "/canvas",
    width: 390,
    height: 844,
    heading: "DrawMCP",
    canvas: true,
  },
];

const args = process.argv.slice(2);
const option = (name: string) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const externalUrl = option("--url");
const outputPath = resolve(
  option("--output") ?? ".evals/visual-qa-latest.json",
);
const screenshotRoot = resolve(
  option("--screenshots") ?? ".evals/visual-qa-screenshots",
);

let vite: ViteDevServer | undefined;
let browser: Browser | undefined;

const inspectPage = async (page: Page, testCase: VisualCase) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(String(error)));

  const baseUrl = externalUrl ?? (() => {
    const address = vite?.httpServer?.address();
    if (!address || typeof address === "string") {
      throw new Error("Visual QA server did not expose a port.");
    }
    return `http://127.0.0.1:${address.port}`;
  })();
  const url = new URL(testCase.path, baseUrl).toString();
  await page.setViewport({ width: testCase.width, height: testCase.height });
  await page.goto(url, { waitUntil: "networkidle0", timeout: 30_000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
    const videos = Array.from(document.querySelectorAll("video"));
    await Promise.all(videos.map((video) => video.play().catch(() => undefined)));
  });
  if (testCase.canvas) {
    await page.waitForSelector(".excalidraw", { timeout: 15_000 });
    await page.waitForFunction(
      () =>
        ((document.body.textContent ?? "").includes("7/7 site tools")),
      { timeout: 15_000 },
    );
  }
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));

  const inspection = await page.evaluate(
    ({ expectedHeading, canvas }) => {
      const headings = Array.from(document.querySelectorAll("h1"), (heading) =>
        (heading.textContent ?? "").replace(/\s+/g, " ").trim(),
      );
      const images = Array.from(document.images);
      const videos = Array.from(document.querySelectorAll("video"));
      let clippedTextElements = 0;
      for (const element of document.querySelectorAll(
        "main h1, main h2, main h3, main p, main li, main pre",
      )) {
        const bounds = element.getBoundingClientRect();
        if (bounds.left >= -1 && bounds.right <= window.innerWidth + 1) continue;
        let insideHorizontalScroller = false;
        let parent = element.parentElement;
        while (parent && parent !== document.body) {
          const overflowX = getComputedStyle(parent).overflowX;
          if (
            (overflowX === "auto" || overflowX === "scroll") &&
            parent.scrollWidth > parent.clientWidth
          ) {
            insideHorizontalScroller = true;
            break;
          }
          parent = parent.parentElement;
        }
        if (!insideHorizontalScroller) clippedTextElements += 1;
      }
      const bodyText = (document.body.textContent ?? "")
        .replace(/\s+/g, " ")
        .trim();
      return {
        heading_found: canvas
          ? bodyText.includes(expectedHeading)
          : headings.includes(expectedHeading),
        main_count: document.querySelectorAll("main").length,
        horizontal_overflow:
          document.documentElement.scrollWidth - window.innerWidth,
        clipped_text_elements: clippedTextElements,
        images: {
          total: images.length,
          failed: images.filter(
            (image) => !image.complete || image.naturalWidth === 0,
          ).length,
        },
        videos: {
          total: videos.length,
          not_ready: videos.filter(
            (video) =>
              video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
              !video.muted ||
              !video.autoplay ||
              !video.loop ||
              !video.playsInline,
          ).length,
        },
        excalidraw_mounted: canvas
          ? document.querySelectorAll(".excalidraw").length === 1
          : undefined,
        retired_game_ui_absent:
          !window.location.search.includes("demo=tic-tac-toe") ||
          (!bodyText.includes("Tic-tac-toe") &&
            !bodyText.includes("Copy agent prompt")),
      };
    },
    { expectedHeading: testCase.heading, canvas: testCase.canvas === true },
  );
  const webmcpTools = testCase.canvas
    ? ((((page as unknown as { webmcp?: { tools?: () => unknown[] } }).webmcp
        ?.tools?.() ?? []) as unknown[]).length)
    : undefined;
  const screenshotPath = resolve(screenshotRoot, `${testCase.name}.png`);
  mkdirSync(dirname(screenshotPath), { recursive: true });
  await page.screenshot({
    path: screenshotPath,
    fullPage: testCase.canvas !== true,
  });

  const errors = [
    ...(inspection.heading_found ? [] : ["Expected route heading was missing."]),
    ...(inspection.main_count === 1 ? [] : [`Expected one main element; saw ${inspection.main_count}.`]),
    ...(inspection.horizontal_overflow <= 1
      ? []
      : [`Horizontal overflow was ${inspection.horizontal_overflow}px.`]),
    ...(inspection.clipped_text_elements === 0
      ? []
      : [`${inspection.clipped_text_elements} text elements were clipped.`]),
    ...(inspection.images.failed === 0
      ? []
      : [`${inspection.images.failed} image assets failed to load.`]),
    ...(inspection.videos.not_ready === 0
      ? []
      : [`${inspection.videos.not_ready} videos were not ready or autoplay-safe.`]),
    ...(testCase.canvas && webmcpTools !== 7
      ? [`Expected 7 WebMCP tools; saw ${webmcpTools}.`]
      : []),
    ...(testCase.canvas && inspection.excalidraw_mounted !== true
      ? ["Excalidraw did not mount exactly once."]
      : []),
    ...(inspection.retired_game_ui_absent
      ? []
      : ["The retired game query rendered game-specific UI."]),
    ...consoleErrors.map((error) => `Console: ${error}`),
    ...pageErrors.map((error) => `Page: ${error}`),
  ];
  return {
    name: testCase.name,
    url,
    viewport: { width: testCase.width, height: testCase.height },
    screenshot: screenshotPath.replace(`${process.cwd()}/`, ""),
    inspection: { ...inspection, webmcp_tools: webmcpTools },
    errors,
    passed: errors.length === 0,
  };
};

const main = async () => {
  if (!externalUrl) {
    vite = await createServer({
      logLevel: "error",
      server: { host: "127.0.0.1", port: 0 },
    });
    await vite.listen();
  }
  browser = await puppeteer.launch({
    browser: "chrome",
    channel: "chrome",
    headless: true,
    args: ["--enable-features=WebMCP", "--no-sandbox", "--disable-setuid-sandbox"],
  });
  const results = [];
  try {
    for (const testCase of cases) {
      const page = await browser.newPage();
      try {
        results.push(await inspectPage(page, testCase));
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
    await vite?.close();
  }
  const report = {
    schema_version: 1,
    recorded_at: new Date().toISOString(),
    target: externalUrl ?? "isolated-local-vite",
    cases: results,
    passed_cases: results.filter(({ passed }) => passed).length,
    total_cases: results.length,
    passed: results.every(({ passed }) => passed),
  };
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Visual QA: ${report.passed_cases}/${report.total_cases} routes passed.`);
  console.log(`Report: ${outputPath}`);
  if (!report.passed) {
    for (const result of results.filter(({ passed }) => !passed)) {
      console.error(`${result.name}: ${result.errors.join(" ")}`);
    }
    process.exitCode = 1;
  }
};

main().catch(async (error) => {
  await browser?.close().catch(() => undefined);
  await vite?.close().catch(() => undefined);
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
