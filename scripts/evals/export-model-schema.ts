import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const adaptForVercelEvaluator = (
  value: unknown,
  onRemovedUnion: () => void,
): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => adaptForVercelEvaluator(item, onRemovedUnion));
  }
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => {
        const keep = key !== "anyOf" && key !== "oneOf";
        if (!keep) onRemovedUnion();
        return keep;
      })
      .map(([key, item]) => [key, adaptForVercelEvaluator(item, onRemovedUnion)]),
  );
};

const adaptForOllamaEvaluator = (
  value: unknown,
  stats: { removed_false_items: number; flattened_prefix_items: number },
): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => adaptForOllamaEvaluator(item, stats));
  }
  if (!value || typeof value !== "object") return value;
  const source = value as Record<string, unknown>;
  const alternatives = (source.anyOf ?? source.oneOf) as unknown;
  if (Array.isArray(alternatives) && alternatives.length > 0) {
    const branches = alternatives.map(
      (branch) => adaptForOllamaEvaluator(branch, stats) as Record<string, unknown>,
    );
    const propertyMaps = branches.map(
      (branch) => (branch.properties ?? {}) as Record<string, unknown>,
    );
    const propertyNames = [...new Set(propertyMaps.flatMap(Object.keys))];
    const properties = Object.fromEntries(
      propertyNames.map((name) => {
        const candidates = propertyMaps
          .map((propertiesForBranch) => propertiesForBranch[name])
          .filter((candidate) => candidate !== undefined) as Array<
          Record<string, unknown>
        >;
        const enumValues = candidates.flatMap((candidate) =>
          Array.isArray(candidate.enum) ? candidate.enum : [],
        );
        return [
          name,
          enumValues.length > 0
            ? { enum: [...new Set(enumValues)] }
            : candidates[0] ?? {},
        ];
      }),
    );
    const requiredLists = branches.map((branch) =>
      Array.isArray(branch.required) ? (branch.required as string[]) : [],
    );
    const required = requiredLists[0].filter((name) =>
      requiredLists.every((list) => list.includes(name)),
    );
    return {
      type: "object",
      additionalProperties: false,
      ...(required.length > 0 ? { required } : {}),
      properties,
    };
  }
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(source)) {
    if (key === "const") {
      result.enum = [item];
      continue;
    }
    if (key === "items" && item === false) {
      stats.removed_false_items += 1;
      continue;
    }
    if (key === "prefixItems" && Array.isArray(item) && item.length > 0) {
      stats.flattened_prefix_items += 1;
      result.items = adaptForOllamaEvaluator(item[0], stats);
      continue;
    }
    result[key] = adaptForOllamaEvaluator(item, stats);
  }
  return result;
};

const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");

const simpleId = { type: "string", minLength: 1, maxLength: 128 };
const simpleNumber = { type: "number" };
const ollamaInputSchema = (name: string, exactSchema: unknown) => {
  if (name === "get_canvas_summary" || name === "get_selection") {
    return {
      type: "object",
      additionalProperties: false,
      properties: {},
    };
  }
  if (name === "add_elements") {
    return {
      type: "object",
      additionalProperties: false,
      required: ["elements"],
      properties: {
        expected_revision: { type: "integer", minimum: 0 },
        elements: {
          type: "array",
          minItems: 1,
          maxItems: 50,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "type", "x", "y", "width", "height"],
            properties: {
              id: simpleId,
              type: { enum: ["rectangle", "ellipse", "diamond"] },
              x: simpleNumber,
              y: simpleNumber,
              width: simpleNumber,
              height: simpleNumber,
              backgroundColor: {
                type: "string",
                pattern: "^#[0-9A-Fa-f]{6}$",
                description: "Six-digit hexadecimal color, such as #a5d8ff.",
              },
              fillStyle: { enum: ["solid", "hachure", "cross-hatch", "zigzag"] },
              label: {
                type: "object",
                additionalProperties: false,
                required: ["text"],
                properties: { text: { type: "string" } },
              },
            },
          },
        },
      },
    };
  }
  if (name === "update_elements") {
    return {
      type: "object",
      additionalProperties: false,
      required: ["expected_revision", "patches"],
      properties: {
        expected_revision: {
          type: "integer",
          minimum: 0,
          description: "Use the revision supplied by the preceding read.",
        },
        patches: {
          type: "array",
          minItems: 1,
          maxItems: 100,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "changes"],
            properties: {
              id: simpleId,
              changes: {
                type: "object",
                additionalProperties: false,
                properties: {
                  x: simpleNumber,
                  y: simpleNumber,
                  width: simpleNumber,
                  height: simpleNumber,
                  text: { type: "string" },
                  backgroundColor: { type: "string" },
                },
              },
            },
          },
        },
      },
    };
  }
  return adaptForOllamaEvaluator(exactSchema, {
    removed_false_items: 0,
    flattened_prefix_items: 0,
  });
};

export const writeModelSchemaManifest = (
  requestedOutputPath: string,
  requestedOllamaSchemaPath?: string,
) => {
  const inputPath = resolve("evals/tools.json");
  const outputPath = resolve(requestedOutputPath);
  const source = readFileSync(inputPath, "utf8");
  const exact = JSON.parse(source) as Record<string, unknown>;
  let removedUnionKeywords = 0;
  const adapted = adaptForVercelEvaluator(
    exact,
    () => (removedUnionKeywords += 1),
  );
  const adaptedSource = JSON.stringify(adapted);
  const exactTools = (exact.tools ?? []) as Array<{
    name: string;
    description: string;
    inputSchema: unknown;
  }>;
  const ollamaAdapted = {
    tools: exactTools.map((tool) => ({
      ...tool,
      inputSchema: ollamaInputSchema(tool.name, tool.inputSchema),
    })),
  };
  const ollamaSource = JSON.stringify(ollamaAdapted);
  const tools = exactTools;
  const manifest = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    exact: {
      path: "evals/tools.json",
      sha256: hash(source),
      bytes: Buffer.byteLength(source),
      tool_names: tools.map(({ name }) => name),
    },
    vercel_evaluator_mapping: {
      sha256: hash(adaptedSource),
      bytes: Buffer.byteLength(adaptedSource),
      removed_union_keywords: removedUnionKeywords,
      warning:
        "webmcp-evals 0.0.4 removes anyOf and oneOf for its Vercel backend. This mapped hash is runner evidence, not the production schema.",
    },
    ollama_evaluator_mapping: {
      sha256: hash(ollamaSource),
      bytes: Buffer.byteLength(ollamaSource),
      specialized_tools: [
        "get_canvas_summary",
        "get_selection",
        "add_elements",
        "update_elements",
      ],
      warning:
        "Ollama's grammar parser rejects the full production schema. This run-only mapping simplifies add and update inputs and is not the production schema.",
    },
  };
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const ollamaSchemaPath = requestedOllamaSchemaPath
    ? resolve(requestedOllamaSchemaPath)
    : undefined;
  if (ollamaSchemaPath) {
    mkdirSync(dirname(ollamaSchemaPath), { recursive: true });
    writeFileSync(ollamaSchemaPath, `${JSON.stringify(ollamaAdapted, null, 2)}\n`);
  }
  return { manifest, outputPath, ollamaSchemaPath };
};

if (resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { outputPath } = writeModelSchemaManifest(
    process.argv[2] ?? ".evals/model-schema-manifest.json",
  );
  console.log(`Wrote model schema manifest to ${outputPath}`);
}
