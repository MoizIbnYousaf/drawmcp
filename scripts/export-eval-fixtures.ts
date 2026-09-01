import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { TOOL_DEFINITIONS, TOOL_NAMES } from "../src/webmcp/tool-contracts";

const outputPath = resolve("evals/tools.json");
mkdirSync(dirname(outputPath), { recursive: true });
const tools = TOOL_NAMES.map((name) => ({
  name,
  description: TOOL_DEFINITIONS[name].description,
  inputSchema: TOOL_DEFINITIONS[name].inputSchema,
}));
writeFileSync(outputPath, `${JSON.stringify({ tools }, null, 2)}\n`);
console.log(`Wrote ${tools.length} WebMCP tool schemas to ${outputPath}`);
