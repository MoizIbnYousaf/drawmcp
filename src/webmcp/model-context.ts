export type ToolAnnotations = {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
};

export type ToolExecutionOptions = {
  signal: AbortSignal;
};

export type ModelContextTool = {
  name: string;
  title?: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  annotations?: ToolAnnotations;
  execute: (
    input: Record<string, unknown>,
    options?: ToolExecutionOptions,
  ) => unknown | Promise<unknown>;
};

export type ToolRegistrationOptions = {
  signal?: AbortSignal;
  exposedTo?: string[];
};

export type ModelContext = {
  registerTool: (
    tool: ModelContextTool,
    options?: ToolRegistrationOptions,
  ) => void | Promise<void>;
};

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
}
