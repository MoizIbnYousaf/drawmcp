import { runSmoke } from "./smoke-runner";

await runSmoke({
  outputPath: ".evals/smoke-latest.json",
  target: "isolated-local-vite",
});
