import Ajv2020, { type ErrorObject } from "ajv/dist/2020.js";

export const TOOL_NAMES = [
  "get_canvas_summary",
  "get_selection",
  "add_elements",
  "update_elements",
  "delete_elements",
  "fit_to_content",
  "organize_diagram",
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

export const TOOL_LIMITS = {
  maxSummaryElements: 200,
  maxSelectionElements: 100,
  maxAddElements: 50,
  maxPatches: 100,
  maxDeleteIds: 100,
  maxTextLength: 2_000,
  maxIdLength: 128,
  maxCoordinate: 1_000_000,
  maxDimension: 100_000,
  minSpacing: 20,
  maxSpacing: 500,
} as const;

const idSchema = {
  type: "string",
  minLength: 1,
  maxLength: TOOL_LIMITS.maxIdLength,
  pattern: "^[A-Za-z0-9_-]+$",
} as const;

const coordinateSchema = {
  type: "number",
  minimum: -TOOL_LIMITS.maxCoordinate,
  maximum: TOOL_LIMITS.maxCoordinate,
} as const;

const dimensionSchema = {
  type: "number",
  minimum: 1,
  maximum: TOOL_LIMITS.maxDimension,
} as const;

const colorSchema = {
  type: "string",
  pattern: "^#[0-9A-Fa-f]{6}$",
} as const;

const styleProperties = {
  strokeColor: colorSchema,
  backgroundColor: colorSchema,
  fillStyle: { enum: ["solid", "hachure", "cross-hatch", "zigzag"] },
  strokeWidth: { type: "number", minimum: 1, maximum: 4 },
  strokeStyle: { enum: ["solid", "dashed", "dotted"] },
  roughness: { type: "number", minimum: 0, maximum: 2 },
  opacity: { type: "number", minimum: 0, maximum: 100 },
  angle: { type: "number", minimum: -6.2832, maximum: 6.2832 },
  locked: { type: "boolean" },
} as const;

const labelSchema = {
  type: "object",
  additionalProperties: false,
  required: ["text"],
  properties: {
    text: {
      type: "string",
      minLength: 1,
      maxLength: TOOL_LIMITS.maxTextLength,
    },
    fontSize: { type: "number", minimum: 8, maximum: 96 },
  },
} as const;

const shapeSchema = (type: "rectangle" | "ellipse" | "diamond") => ({
  type: "object",
  additionalProperties: false,
  required: ["id", "type", "x", "y", "width", "height"],
  properties: {
    id: idSchema,
    type: { const: type },
    x: coordinateSchema,
    y: coordinateSchema,
    width: dimensionSchema,
    height: dimensionSchema,
    label: labelSchema,
    ...styleProperties,
  },
});

const textSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "type", "x", "y", "text"],
  properties: {
    id: idSchema,
    type: { const: "text" },
    x: coordinateSchema,
    y: coordinateSchema,
    text: {
      type: "string",
      minLength: 1,
      maxLength: TOOL_LIMITS.maxTextLength,
    },
    fontSize: { type: "number", minimum: 8, maximum: 96 },
    ...styleProperties,
  },
} as const;

const linearSchema = (type: "arrow" | "line") => ({
  type: "object",
  additionalProperties: false,
  required: ["id", "type", "x", "y", "points"],
  properties: {
    id: idSchema,
    type: { const: type },
    x: coordinateSchema,
    y: coordinateSchema,
    points: {
      type: "array",
      minItems: 2,
      maxItems: 50,
      items: {
        type: "array",
        minItems: 2,
        maxItems: 2,
        prefixItems: [coordinateSchema, coordinateSchema],
        items: false,
      },
    },
    startArrowhead: { enum: [null, "arrow", "bar", "dot", "triangle"] },
    endArrowhead: { enum: [null, "arrow", "bar", "dot", "triangle"] },
    label: labelSchema,
    ...styleProperties,
  },
});

const skeletonSchema = {
  anyOf: [
    shapeSchema("rectangle"),
    shapeSchema("ellipse"),
    shapeSchema("diamond"),
    textSchema,
    linearSchema("arrow"),
    linearSchema("line"),
  ],
} as const;

const expectedRevision = { type: "integer", minimum: 0 } as const;

const schemas = {
  get_canvas_summary: {
    type: "object",
    additionalProperties: false,
    properties: {},
  },
  get_selection: {
    type: "object",
    additionalProperties: false,
    properties: {},
  },
  add_elements: {
    type: "object",
    additionalProperties: false,
    required: ["elements"],
    properties: {
      expected_revision: expectedRevision,
      elements: {
        type: "array",
        minItems: 1,
        maxItems: TOOL_LIMITS.maxAddElements,
        items: skeletonSchema,
      },
    },
  },
  update_elements: {
    type: "object",
    additionalProperties: false,
    required: ["patches"],
    properties: {
      expected_revision: expectedRevision,
      patches: {
        type: "array",
        minItems: 1,
        maxItems: TOOL_LIMITS.maxPatches,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "changes"],
          properties: {
            id: idSchema,
            changes: {
              type: "object",
              additionalProperties: false,
              minProperties: 1,
              properties: {
                x: coordinateSchema,
                y: coordinateSchema,
                width: dimensionSchema,
                height: dimensionSchema,
                text: {
                  type: "string",
                  minLength: 1,
                  maxLength: TOOL_LIMITS.maxTextLength,
                },
                ...styleProperties,
              },
            },
          },
        },
      },
    },
  },
  delete_elements: {
    type: "object",
    additionalProperties: false,
    required: ["ids"],
    properties: {
      expected_revision: expectedRevision,
      ids: {
        type: "array",
        minItems: 1,
        maxItems: TOOL_LIMITS.maxDeleteIds,
        uniqueItems: true,
        items: idSchema,
      },
    },
  },
  fit_to_content: {
    type: "object",
    additionalProperties: false,
    required: ["scope"],
    properties: {
      scope: { enum: ["selection", "all"] },
      animate: { type: "boolean" },
    },
  },
  organize_diagram: {
    type: "object",
    additionalProperties: false,
    required: ["scope", "layout"],
    properties: {
      expected_revision: expectedRevision,
      scope: { enum: ["selection", "all"] },
      layout: { enum: ["horizontal", "vertical", "grid"] },
      spacing: {
        type: "number",
        minimum: TOOL_LIMITS.minSpacing,
        maximum: TOOL_LIMITS.maxSpacing,
      },
    },
  },
} as const;

export const TOOL_DEFINITIONS = {
  get_canvas_summary: {
    title: "Read canvas summary",
    description:
      "Read a bounded summary of the current DrawMCP canvas and revision.",
    inputSchema: schemas.get_canvas_summary,
    annotations: { readOnlyHint: true, untrustedContentHint: true },
  },
  get_selection: {
    title: "Read current selection",
    description:
      "Read the elements currently selected by the person in DrawMCP.",
    inputSchema: schemas.get_selection,
    annotations: { readOnlyHint: true, untrustedContentHint: true },
  },
  add_elements: {
    title: "Add canvas elements",
    description:
      "Add validated Excalidraw elements to the current canvas as one undoable action.",
    inputSchema: schemas.add_elements,
    annotations: { readOnlyHint: false, untrustedContentHint: false },
  },
  update_elements: {
    title: "Update canvas elements",
    description:
      "Update allowlisted fields on current elements as one undoable action.",
    inputSchema: schemas.update_elements,
    annotations: { readOnlyHint: false, untrustedContentHint: false },
  },
  delete_elements: {
    title: "Delete canvas elements",
    description: "Delete current elements by stable ID as one undoable action.",
    inputSchema: schemas.delete_elements,
    annotations: { readOnlyHint: false, untrustedContentHint: false },
  },
  fit_to_content: {
    title: "Focus canvas content",
    description:
      "Move the visible viewport to the current selection or all canvas elements.",
    inputSchema: schemas.fit_to_content,
    annotations: { readOnlyHint: false, untrustedContentHint: false },
  },
  organize_diagram: {
    title: "Organize diagram",
    description:
      "Arrange supported current nodes with a deterministic local layout as one undoable action.",
    inputSchema: schemas.organize_diagram,
    annotations: { readOnlyHint: false, untrustedContentHint: false },
  },
} as const;

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validators = Object.fromEntries(
  TOOL_NAMES.map((name) => [
    name,
    ajv.compile(TOOL_DEFINITIONS[name].inputSchema),
  ]),
) as Record<ToolName, ReturnType<typeof ajv.compile>>;

export type InputValidationResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; errors: ErrorObject[] };

export const validateToolInput = (
  name: ToolName,
  input: unknown,
): InputValidationResult => {
  const value = input ?? {};
  const validator = validators[name];
  if (validator(value)) {
    return { ok: true, value: value as Record<string, unknown> };
  }
  return { ok: false, errors: validator.errors ?? [] };
};
