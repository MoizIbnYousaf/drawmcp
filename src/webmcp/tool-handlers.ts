import type { CanvasService } from "../excalidraw/canvas-service";
import { recordToolMetric } from "../observability/tool-metrics";
import type { ModelContextTool } from "./model-context";
import {
  TOOL_DEFINITIONS,
  TOOL_NAMES,
  validateToolInput,
  type AddElementsInput,
  type DeleteElementsInput,
  type FitToContentInput,
  type OrganizeDiagramInput,
  type ToolName,
  type UpdateElementsInput,
} from "./tool-contracts";
import {
  canceledResult,
  internalErrorResult,
  type ToolFailure,
} from "./tool-results";

const invalidInputResult = (name: ToolName, errors: unknown): ToolFailure =>
  ({
    ok: false,
    code: "INVALID_INPUT",
    message: `The ${name} arguments did not match the declared schema.`,
    details: errors,
  }) as ToolFailure & { details: unknown };

const executeTool = async (
  name: ToolName,
  service: CanvasService,
  input: Record<string, unknown>,
  signal: AbortSignal,
) => {
  if (signal.aborted) return canceledResult();
  const validation = validateToolInput(name, input);
  if (!validation.ok) return invalidInputResult(name, validation.errors);

  try {
    switch (name) {
      case "get_canvas_summary":
        return service.getCanvasSummary();
      case "get_selection":
        return service.getSelection();
      case "add_elements":
        return service.addElements(
          validation.value as AddElementsInput,
          signal,
        );
      case "update_elements":
        return service.updateElements(
          validation.value as UpdateElementsInput,
          signal,
        );
      case "delete_elements":
        return service.deleteElements(
          validation.value as DeleteElementsInput,
          signal,
        );
      case "fit_to_content":
        return service.fitToContent(validation.value as FitToContentInput);
      case "organize_diagram":
        return service.organize(
          validation.value as OrganizeDiagramInput,
          signal,
        );
    }
  } catch {
    return signal.aborted ? canceledResult() : internalErrorResult();
  }
};

export const createDrawMcpTools = (
  service: CanvasService,
): ModelContextTool[] =>
  TOOL_NAMES.map((name) => {
    const definition = TOOL_DEFINITIONS[name];
    return {
      name,
      title: definition.title,
      description: definition.description,
      inputSchema: definition.inputSchema,
      annotations: definition.annotations,
      execute: async (input, options) => {
        const startedAt = performance.now();
        const result = await executeTool(
          name,
          service,
          input,
          options?.signal ?? new AbortController().signal,
        );
        recordToolMetric(
          name,
          startedAt,
          performance.now(),
          Boolean(
            result && typeof result === "object" && "ok" in result && result.ok,
          ),
        );
        return result;
      },
    };
  });
