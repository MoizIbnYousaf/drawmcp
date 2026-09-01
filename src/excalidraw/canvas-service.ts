import { TOOL_LIMITS } from "../webmcp/tool-contracts";
import type { ToolFailure, ToolResult } from "../webmcp/tool-results";
import { canceledResult, internalErrorResult } from "../webmcp/tool-results";
import {
  projectElement,
  summarizeElements,
  type CanvasElement,
} from "./element-projection";
import { RevisionController, type RevisionActor } from "./revision-controller";

type CanvasAppState = {
  selectedElementIds?: Record<string, boolean>;
};

type CanvasFiles = Record<string, unknown>;

export type CanvasApi = {
  isDestroyed: boolean;
  getSceneElements: () => readonly CanvasElement[];
  getSceneElementsIncludingDeleted: () => readonly CanvasElement[];
  getAppState: () => CanvasAppState;
  getFiles: () => CanvasFiles;
  updateScene: (scene: {
    elements?: readonly CanvasElement[];
    captureUpdate?: unknown;
  }) => void;
  scrollToContent: (
    target?: readonly CanvasElement[],
    options?: Record<string, unknown>,
  ) => void;
};

export type CanvasStatus = {
  revision: number;
  lastActor: RevisionActor | null;
  lastOperation: string | null;
  available: boolean;
};

export type MutationReceipt = {
  operation: string;
  revision_before: number;
  revision_after: number;
  affected_element_ids: string[];
  element_count: number;
};

export type ReplaceElementsRequest = {
  operation: string;
  expectedRevision?: number;
  elements: CanvasElement[];
  affectedIds: string[];
  signal: AbortSignal;
};

const unavailableResult = (): ToolFailure => ({
  ok: false,
  code: "UNAVAILABLE",
  message: "The Excalidraw canvas is not ready.",
});

const staleResult = (revision: number): ToolFailure => ({
  ok: false,
  code: "STALE_REVISION",
  message:
    "The canvas changed after the agent's last read. Read it again before retrying.",
  current_revision: revision,
});

export class CanvasService {
  private readonly captureUpdateImmediately: unknown;
  private api?: CanvasApi;
  private readonly revisions = new RevisionController();
  private mutationTail: Promise<unknown> = Promise.resolve();
  private listeners = new Set<(status: CanvasStatus) => void>();

  constructor(options: { captureUpdateImmediately?: unknown } = {}) {
    this.captureUpdateImmediately =
      options.captureUpdateImmediately ?? "IMMEDIATELY";
  }

  attach(api: CanvasApi): void {
    this.api = api;
    this.emitStatus();
  }

  detach(): void {
    this.revisions.cancelPending("The Excalidraw canvas was detached.");
    this.api = undefined;
    this.emitStatus();
  }

  subscribe(listener: (status: CanvasStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }

  observeEditorChange(
    elements: readonly CanvasElement[],
    _appState: CanvasAppState,
    _files: CanvasFiles,
  ): void {
    this.revisions.observe([...elements]);
    this.emitStatus();
  }

  getStatus(): CanvasStatus {
    const snapshot = this.revisions.getSnapshot();
    return {
      ...snapshot,
      available: Boolean(this.api && !this.api.isDestroyed),
    };
  }

  getCanvasSummary(): ToolResult<Record<string, unknown>> {
    const api = this.getAvailableApi();
    if (!api) return unavailableResult();
    const elements = [...api.getSceneElements()];
    const selection = api.getAppState().selectedElementIds ?? {};
    return {
      ok: true,
      revision: this.revisions.getSnapshot().revision,
      selected_count: Object.values(selection).filter(Boolean).length,
      ...summarizeElements(elements, TOOL_LIMITS.maxSummaryElements),
    };
  }

  getSelection(): ToolResult<Record<string, unknown>> {
    const api = this.getAvailableApi();
    if (!api) return unavailableResult();
    const selected = api.getAppState().selectedElementIds ?? {};
    const selectedIds = Object.keys(selected).filter((id) => selected[id]);
    const selectedSet = new Set(selectedIds);
    const elements = api
      .getSceneElements()
      .filter((element) => selectedSet.has(element.id))
      .slice(0, TOOL_LIMITS.maxSelectionElements)
      .map(projectElement);
    return {
      ok: true,
      revision: this.revisions.getSnapshot().revision,
      selected_ids: selectedIds,
      elements,
      truncated: selectedIds.length > TOOL_LIMITS.maxSelectionElements,
    };
  }

  replaceElements(
    request: ReplaceElementsRequest,
  ): Promise<ToolResult<MutationReceipt>> {
    const run = async (): Promise<ToolResult<MutationReceipt>> => {
      if (request.signal.aborted) return canceledResult();
      const api = this.getAvailableApi();
      if (!api) return unavailableResult();
      const before = this.revisions.getSnapshot().revision;
      if (
        request.expectedRevision !== undefined &&
        request.expectedRevision !== before
      ) {
        return staleResult(before);
      }

      try {
        const pending = this.revisions.expectAgentChange(
          request.operation,
          request.elements,
        );
        api.updateScene({
          elements: request.elements,
          captureUpdate: this.captureUpdateImmediately,
        });
        await Promise.resolve();
        this.revisions.observe([...api.getSceneElementsIncludingDeleted()]);
        const settled = await pending;
        this.emitStatus();
        return {
          ok: true,
          operation: request.operation,
          revision_before: before,
          revision_after: settled.revision,
          affected_element_ids: request.affectedIds,
          element_count: api.getSceneElements().length,
        };
      } catch (error) {
        if (request.signal.aborted) return canceledResult();
        if (
          error instanceof Error &&
          error.message.includes("canvas changed")
        ) {
          return staleResult(this.revisions.getSnapshot().revision);
        }
        return internalErrorResult();
      }
    };

    const result = this.mutationTail.then(run, run);
    this.mutationTail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  private getAvailableApi(): CanvasApi | undefined {
    return this.api && !this.api.isDestroyed ? this.api : undefined;
  }

  private emitStatus(): void {
    const status = this.getStatus();
    for (const listener of this.listeners) listener(status);
  }
}
