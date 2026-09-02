import { runSmoke } from "./smoke-runner";

const url = process.env.DRAWMCP_PRODUCTION_URL ?? "https://drawmcp.dev/canvas";
if (!url.startsWith("https://")) {
  throw new Error("Production smoke requires an HTTPS URL.");
}

await runSmoke({
  outputPath: ".evals/production-smoke-latest.json",
  target: "production",
  url,
});
