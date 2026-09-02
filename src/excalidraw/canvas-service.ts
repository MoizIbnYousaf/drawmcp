import { organizeDiagram } from "../layout/organize-diagram";
import {
  TOOL_LIMITS,
  type AddElementsInput,
  type DeleteElementsInput,
  type FitToContentInput,
  type OrganizeDiagramInput,
  type UpdateElementsInput,
} from "../webmcp/tool-contracts";
import type { ToolFailure, ToolResult } from "../webmcp/tool-results";
import {
  canceledResult,
  internalErrorResult,
  timeoutResult,
} from "../webmcp/tool-results";
import {
  projectElement,
  summarizeElements,
  type CanvasElement,
} from "./element-projection";
import {
  RevisionController,
  sceneSemanticFingerprint,
  type RevisionActor,
} from "./revision-controller";

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
  changed: boolean;
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

const invalidResult = (message: string): ToolFailure => ({
  ok: false,
  code: "INVALID_INPUT",
  message,
});

const notFoundResult = (message: string): ToolFailure => ({
  ok: false,
  code: "NOT_FOUND",
  message,
});

type MutationComputation =
  | { elements: CanvasElement[]; affectedIds: string[] }
  | ToolFailure;

export type UpdateCanvasElement = (
  element: CanvasElement,
  changes: Record<string, unknown>,
) => CanvasElement;

const fallbackUpdateElement: UpdateCanvasElement = (element, changes) => ({
  ...element,
  ...changes,
  version:
    (typeof element.version === "number" ? element.version : 0) + 1,
  versionNonce:
    (typeof element.versionNonce === "number" ? element.versionNonce : 0) + 1,
  updated: Date.now(),
});

const isToolFailure = (value: MutationComputation): value is ToolFailure =>
  "ok" in value && value.ok === false;

class MutationSettleTimeoutError extends Error {}

export class CanvasService {
  private readonly captureUpdateImmediately: unknown;
  private readonly convertElements: (
    elements: AddElementsInput["elements"],
  ) => CanvasElement[];
  private readonly updateElement: UpdateCanvasElement;
  private readonly settleTimeoutMs: number;
  private api?: CanvasApi;
  private readonly revisions = new RevisionController();
  private mutationTail: Promise<unknown> = Promise.resolve();
  private listeners = new Set<(status: CanvasStatus) => void>();

  constructor(
    options: {
      captureUpdateImmediately?: unknown;
      convertElements?: (
        elements: AddElementsInput["elements"],
      ) => CanvasElement[];
      updateElement?: UpdateCanvasElement;
      settleTimeoutMs?: number;
    } = {},
  ) {
    this.captureUpdateImmediately =
      options.captureUpdateImmediately ?? "IMMEDIATELY";
    this.convertElements =
      options.convertElements ??
      ((elements) => elements as unknown as CanvasElement[]);
    this.updateElement = options.updateElement ?? fallbackUpdateElement;
    this.settleTimeoutMs = options.settleTimeoutMs ?? 2_000;
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

  addElements(
    input: AddElementsInput,
    signal: AbortSignal,
  ): Promise<ToolResult<MutationReceipt>> {
    return this.enqueueMutation({
      operation: "add_elements",
      expectedRevision: input.expected_revision,
      signal,
      compute: (api) => {
        const current = [...api.getSceneElementsIncludingDeleted()];
        const currentIds = new Set(current.map(({ id }) => id));
        const requestedIds = input.elements.map(({ id }) => id);
        if (new Set(requestedIds).size !== requestedIds.length) {
          return invalidResult(
            "Element IDs must be unique within one add request.",
          );
        }
        const duplicate = requestedIds.find((id) => currentIds.has(id));
        if (duplicate) {
          return invalidResult(`Element ID already exists: ${duplicate}`);
        }
        const converted = this.convertElements(input.elements);
        return {
          elements: [...current, ...converted],
          affectedIds: converted.map(({ id }) => id),
        };
      },
    });
  }

  updateElements(
    input: UpdateElementsInput,
    signal: AbortSignal,
  ): Promise<ToolResult<MutationReceipt>> {
    return this.enqueueMutation({
      operation: "update_elements",
      expectedRevision: input.expected_revision,
      signal,
      compute: (api) => {
        const current = [...api.getSceneElementsIncludingDeleted()];
        const currentIds = new Set(
          current.filter(({ isDeleted }) => !isDeleted).map(({ id }) => id),
        );
        const missing = input.patches.find(({ id }) => !currentIds.has(id));
        if (missing) return notFoundResult(`Element not found: ${missing.id}`);
        const patches = new Map(
          input.patches.map((patch) => [patch.id, patch]),
        );
        return {
          elements: current.map((element) => {
            const patch = patches.get(element.id);
            return patch
              ? this.updateElement(element, patch.changes)
              : element;
          }),
          affectedIds: input.patches.map(({ id }) => id),
        };
      },
    });
  }

  deleteElements(
    input: DeleteElementsInput,
    signal: AbortSignal,
  ): Promise<ToolResult<MutationReceipt>> {
    return this.enqueueMutation({
      operation: "delete_elements",
      expectedRevision: input.expected_revision,
      signal,
      compute: (api) => {
        const current = [...api.getSceneElementsIncludingDeleted()];
        const liveIds = new Set(
          current.filter(({ isDeleted }) => !isDeleted).map(({ id }) => id),
        );
        const missing = input.ids.find((id) => !liveIds.has(id));
        if (missing) return notFoundResult(`Element not found: ${missing}`);
        const targets = new Set(input.ids);
        const affectedIds: string[] = [];
        const elements = current.map((element) => {
          const ownedText =
            typeof element.containerId === "string" &&
            targets.has(element.containerId);
          if (targets.has(element.id) || ownedText) {
            affectedIds.push(element.id);
            return this.updateElement(element, { isDeleted: true });
          }
          return element;
        });
        return { elements, affectedIds };
      },
    });
  }

  fitToContent(input: FitToContentInput): ToolResult<Record<string, unknown>> {
    const api = this.getAvailableApi();
    if (!api) return unavailableResult();
    const current = [...api.getSceneElements()];
    const selected = api.getAppState().selectedElementIds ?? {};
    const target =
      input.scope === "selection"
        ? current.filter(({ id }) => selected[id])
        : current;
    if (target.length === 0) {
      return notFoundResult(
        input.scope === "selection"
          ? "No elements are selected."
          : "The canvas has no elements to focus.",
      );
    }
    api.scrollToContent(target, {
      fitToContent: true,
      animate: input.animate ?? true,
    });
    return {
      ok: true,
      revision: this.revisions.getSnapshot().revision,
      focused_ids: target.map(({ id }) => id),
      scope: input.scope,
    };
  }

  organize(
    input: OrganizeDiagramInput,
    signal: AbortSignal,
  ): Promise<ToolResult<MutationReceipt & { skipped_element_ids: string[] }>> {
    let skippedIds: string[] = [];
    return this.enqueueMutation({
      operation: "organize_diagram",
      expectedRevision: input.expected_revision,
      signal,
      compute: (api) => {
        const current = [...api.getSceneElementsIncludingDeleted()];
        const live = current.filter(({ isDeleted }) => !isDeleted);
        const selected = api.getAppState().selectedElementIds ?? {};
        const targetIds = new Set(
          input.scope === "selection"
            ? Object.keys(selected).filter((id) => selected[id])
            : live.map(({ id }) => id),
        );
        if (targetIds.size === 0) {
          return notFoundResult(
            input.scope === "selection"
              ? "No elements are selected."
              : "The canvas has no elements to organize.",
          );
        }
        if (signal.aborted) return canceledResult();
        const organized = organizeDiagram(
          current,
          targetIds,
          input.layout,
          input.spacing ?? 80,
        );
        skippedIds = organized.skippedIds;
        if (organized.movedIds.length === 0) {
          return notFoundResult(
            "No supported nodes were available to organize.",
          );
        }
        return {
          elements: current.map((element, index) => {
            if (!organized.movedIds.includes(element.id)) return element;
            const organizedElement = organized.elements[index];
            return this.updateElement(element, {
              x: organizedElement.x,
              y: organizedElement.y,
            });
          }),
          affectedIds: organized.movedIds,
        };
      },
    }).then((result) =>
      result.ok ? { ...result, skipped_element_ids: skippedIds } : result,
    );
  }

  replaceElements(
    request: ReplaceElementsRequest,
  ): Promise<ToolResult<MutationReceipt>> {
    return this.enqueueMutation({
      operation: request.operation,
      expectedRevision: request.expectedRevision,
      signal: request.signal,
      compute: () => ({
        elements: request.elements,
        affectedIds: request.affectedIds,
      }),
    });
  }

  private enqueueMutation(input: {
    operation: string;
    expectedRevision?: number;
    signal: AbortSignal;
    compute: (api: CanvasApi) => MutationComputation;
  }): Promise<ToolResult<MutationReceipt>> {
    const run = async (): Promise<ToolResult<MutationReceipt>> => {
      if (input.signal.aborted) return canceledResult();
      const api = this.getAvailableApi();
      if (!api) return unavailableResult();
      const before = this.revisions.getSnapshot().revision;
      if (
        input.expectedRevision !== undefined &&
        input.expectedRevision !== before
      ) {
        return staleResult(before);
      }

      let pendingStarted = false;
      let commitStarted = false;
      let settleTimer: ReturnType<typeof setTimeout> | undefined;
      try {
        const computed = input.compute(api);
        if (isToolFailure(computed)) return computed;
        if (input.signal.aborted) return canceledResult();
        const current = [...api.getSceneElementsIncludingDeleted()];
        if (
          sceneSemanticFingerprint(current) ===
          sceneSemanticFingerprint(computed.elements)
        ) {
          return {
            ok: true,
            operation: input.operation,
            changed: false,
            revision_before: before,
            revision_after: before,
            affected_element_ids: [],
            element_count: api.getSceneElements().length,
          };
        }
        const pending = this.revisions.expectAgentChange(
          input.operation,
          computed.elements,
        );
        pendingStarted = true;
        void pending.catch(() => undefined);
        commitStarted = true;
        api.updateScene({
          elements: computed.elements,
          captureUpdate: this.captureUpdateImmediately,
        });
        await Promise.resolve();
        this.revisions.observe([...api.getSceneElementsIncludingDeleted()]);
        const settled = await Promise.race([
          pending,
          new Promise<never>((_, reject) => {
            settleTimer = setTimeout(
              () => reject(new MutationSettleTimeoutError()),
              this.settleTimeoutMs,
            );
          }),
        ]);
        this.emitStatus();
        return {
          ok: true,
          operation: input.operation,
          changed: true,
          revision_before: before,
          revision_after: settled.revision,
          affected_element_ids: computed.affectedIds,
          element_count: api.getSceneElements().length,
        };
      } catch (error) {
        if (pendingStarted) {
          this.revisions.cancelPending(
            error instanceof Error ? error : new Error(String(error)),
          );
        }
        if (!commitStarted && input.signal.aborted) return canceledResult();
        if (!this.getAvailableApi()) return unavailableResult();
        if (error instanceof MutationSettleTimeoutError) return timeoutResult();
        if (
          error instanceof Error &&
          error.message.includes("canvas changed")
        ) {
          return staleResult(this.revisions.getSnapshot().revision);
        }
        return internalErrorResult();
      } finally {
        if (settleTimer) clearTimeout(settleTimer);
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
