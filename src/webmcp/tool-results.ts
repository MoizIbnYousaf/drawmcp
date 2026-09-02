export type ToolErrorCode =
  | "CANCELED"
  | "INVALID_INPUT"
  | "NOT_FOUND"
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
