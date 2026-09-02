export type ToolErrorCode =
  | "CANCELED"
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "OUTPUT_TOO_LARGE"
  | "STALE_REVISION"
  | "TIMEOUT"
  | "UNAVAILABLE"
  | "INTERNAL_ERROR";

export type ToolFailure = {
  ok: false;
  code: ToolErrorCode;
  message: string;
  current_revision?: number;
};

export const MAX_TOOL_RESULT_CHARACTERS = 1_536;

export const serializedToolResultLength = (value: unknown): number => {
  try {
    return Array.from(JSON.stringify(value)).length;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
};

export const finalizeToolResult = <T>(value: T): T | ToolFailure => {
  if (serializedToolResultLength(value) <= MAX_TOOL_RESULT_CHARACTERS) {
    return value;
  }
  return {
    ok: false,
    code: "OUTPUT_TOO_LARGE",
    message:
      "The tool result exceeded the DrawMCP output budget. Request a smaller page and retry.",
  };
};

export type ToolSuccess<T extends Record<string, unknown>> = { ok: true } & T;

export type ToolResult<T extends Record<string, unknown>> =
  | ToolSuccess<T>
  | ToolFailure;

export const canceledResult = (): ToolFailure => ({
  ok: false,
  code: "CANCELED",
  message: "The tool execution was canceled before it completed.",
});

export const internalErrorResult = (): ToolFailure => ({
  ok: false,
  code: "INTERNAL_ERROR",
  message: "The canvas operation could not be completed.",
});

export const timeoutResult = (): ToolFailure => ({
  ok: false,
  code: "TIMEOUT",
  message:
    "The canvas did not confirm the requested change before the operation timed out.",
});
