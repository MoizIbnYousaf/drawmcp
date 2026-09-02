import { organizeDiagram } from "../layout/organize-diagram";
import {
  TOOL_LIMITS,
  type AddElementsInput,
  type CanvasReadInput,
  type DeleteElementsInput,
  type FitToContentInput,
  type OrganizeDiagramInput,
  type UpdateElementsInput,
} from "../webmcp/tool-contracts";
import type { ToolFailure, ToolResult } from "../webmcp/tool-results";
import {
  canceledResult,
  internalErrorResult,
  MAX_TOOL_RESULT_CHARACTERS,
  serializedToolResultLength,
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
  affected_element_count: number;
  affected_element_ids: string[];
  affected_ids_truncated: boolean;
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

const outputTooLargeResult = (): ToolFailure => ({
  ok: false,
  code: "OUTPUT_TOO_LARGE",
  message:
    "The requested canvas page exceeded the DrawMCP output budget. Request a smaller page and retry.",
});

const BINDABLE_TOOL_TYPES = new Set(["rectangle", "ellipse", "diamond"]);

const bindingIdFromInput = (value: unknown): string | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const id = (value as { id?: unknown }).id;
  return typeof id === "string" ? id : undefined;
};

type MutationComputation =
  | {
      elements: CanvasElement[];
      affectedIds: string[];
      isApplied?: (actual: CanvasElement[]) => boolean;
    }
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
  private readonly waitForEditorSettle: () => Promise<void>;
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
      waitForEditorSettle?: () => Promise<void>;
    } = {},
  ) {
    this.captureUpdateImmediately =
      options.captureUpdateImmediately ?? "IMMEDIATELY";
    this.convertElements =
      options.convertElements ??
      ((elements) => elements as unknown as CanvasElement[]);
    this.updateElement = options.updateElement ?? fallbackUpdateElement;
    this.settleTimeoutMs = options.settleTimeoutMs ?? 2_000;
    this.waitForEditorSettle = options.waitForEditorSettle ?? (() => Promise.resolve());
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

  getCanvasSummary(
    input: CanvasReadInput = {},
  ): ToolResult<Record<string, unknown>> {
    const api = this.getAvailableApi();
    if (!api) return unavailableResult();
    const elements = [...api.getSceneElements()];
    const selection = api.getAppState().selectedElementIds ?? {};
    const { elements: _elements, truncated: _truncated, ...summary } =
      summarizeElements(elements, 0);
    return this.pageElements(elements, input, {
      selected_count: elements.filter(({ id }) => selection[id]).length,
      ...summary,
    });
  }

  getSelection(input: CanvasReadInput = {}): ToolResult<Record<string, unknown>> {
    const api = this.getAvailableApi();
    if (!api) return unavailableResult();
    const selected = api.getAppState().selectedElementIds ?? {};
    const selectedIds = Object.keys(selected).filter((id) => selected[id]);
    const selectedSet = new Set(selectedIds);
    const elements = api
      .getSceneElements()
      .filter((element) => selectedSet.has(element.id));
    return this.pageElements(elements, input, {
      selected_count: elements.length,
    });
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
        const requested = new Map(
          input.elements.map((element) => [element.id, element]),
        );
        const currentLive = new Map(
          current
            .filter(({ isDeleted }) => !isDeleted)
            .map((element) => [element.id, element]),
        );
        for (const element of input.elements) {
          if (element.type !== "arrow" && element.type !== "line") continue;
          for (const side of ["start", "end"] as const) {
            const referenceId = bindingIdFromInput(element[side]);
            if (!referenceId) continue;
            const target = requested.get(referenceId) ?? currentLive.get(referenceId);
            if (
              referenceId === element.id ||
              !target ||
              !BINDABLE_TOOL_TYPES.has(target.type)
            ) {
              return invalidResult(
                `Invalid ${side} binding target for ${element.id}: ${referenceId}`,
              );
            }
          }
        }
        const converted = this.convertElements(input.elements);
        return {
          elements: [...current, ...converted],
          affectedIds: converted.map(({ id }) => id),
          isApplied: (actual) =>
            converted.every((expected) =>
              actual.some(
                (element) =>
                  element.id === expected.id &&
                  element.type === expected.type &&
                  !element.isDeleted,
              ),
            ),
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
          isApplied: (actual) =>
            input.patches.every((patch) => {
              const element = actual.find(
                (candidate) => candidate.id === patch.id && !candidate.isDeleted,
              );
              return (
                element !== undefined &&
                Object.entries(patch.changes).every(
                  ([key, value]) =>
                    JSON.stringify(element[key]) === JSON.stringify(value),
                )
              );
            }),
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
        const ownedTextIds = new Set(
          current
            .filter(
              (element) =>
                typeof element.containerId === "string" &&
                targets.has(element.containerId),
            )
            .map(({ id }) => id),
        );
        const deletedIds = new Set([...targets, ...ownedTextIds]);
        const affectedIds = new Set<string>();
        const elements = current.map((element) => {
          if (deletedIds.has(element.id)) {
            affectedIds.add(element.id);
            return this.updateElement(element, { isDeleted: true });
          }
          const changes: Record<string, unknown> = {};
          if (Array.isArray(element.boundElements)) {
            const boundElements = element.boundElements.filter((binding) => {
              if (!binding || typeof binding !== "object") return true;
              const id = (binding as { id?: unknown }).id;
              return typeof id !== "string" || !deletedIds.has(id);
            });
            if (boundElements.length !== element.boundElements.length) {
              changes.boundElements = boundElements;
            }
          }
          const startBindingId = bindingIdFromInput(
            element.startBinding && typeof element.startBinding === "object"
              ? {
                  id: (element.startBinding as { elementId?: unknown })
                    .elementId,
                }
              : undefined,
          );
          const endBindingId = bindingIdFromInput(
            element.endBinding && typeof element.endBinding === "object"
              ? {
                  id: (element.endBinding as { elementId?: unknown }).elementId,
                }
              : undefined,
          );
          if (startBindingId && deletedIds.has(startBindingId)) {
            changes.startBinding = null;
          }
          if (endBindingId && deletedIds.has(endBindingId)) {
            changes.endBinding = null;
          }
          if (Object.keys(changes).length > 0) {
            affectedIds.add(element.id);
            return this.updateElement(element, changes);
          }
          return element;
        });
        return {
          elements,
          affectedIds: [...affectedIds],
          isApplied: (actual) =>
            [...deletedIds].every((id) =>
              actual.some((element) => element.id === id && element.isDeleted),
            ),
        };
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
      focused_element_count: target.length,
      focused_element_ids: target
        .slice(0, TOOL_LIMITS.maxReceiptIds)
        .map(({ id }) => id),
      focused_ids_truncated: target.length > TOOL_LIMITS.maxReceiptIds,
      scope: input.scope,
    };
  }

  organize(
    input: OrganizeDiagramInput,
    signal: AbortSignal,
  ): Promise<
    ToolResult<
      MutationReceipt & {
        skipped_element_count: number;
        skipped_element_ids: string[];
        skipped_ids_truncated: boolean;
      }
    >
  > {
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
        const movedIds = new Set(organized.movedIds);
        return {
          elements: current.map((element, index) => {
            if (!movedIds.has(element.id)) return element;
            const organizedElement = organized.elements[index];
            return this.updateElement(element, {
              x: organizedElement.x,
              y: organizedElement.y,
              width: organizedElement.width,
              height: organizedElement.height,
              ...(Array.isArray(organizedElement.points)
                ? { points: organizedElement.points }
                : {}),
            });
          }),
          affectedIds: organized.movedIds,
          isApplied: (actual) =>
            organized.movedIds.every((id) => {
              const expected = organized.elements.find(
                (element) => element.id === id,
              );
              const observed = actual.find((element) => element.id === id);
              return (
                expected !== undefined &&
                observed !== undefined &&
                expected.x === observed.x &&
                expected.y === observed.y &&
                (!Array.isArray(expected.points) ||
                  JSON.stringify(expected.points) ===
                    JSON.stringify(observed.points))
              );
            }),
        };
      },
    }).then((result) =>
      result.ok
        ? {
            ...result,
            skipped_element_count: skippedIds.length,
            skipped_element_ids: skippedIds.slice(0, TOOL_LIMITS.maxReceiptIds),
            skipped_ids_truncated:
              skippedIds.length > TOOL_LIMITS.maxReceiptIds,
          }
        : result,
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
        isApplied: (actual) =>
          sceneSemanticFingerprint(actual) ===
          sceneSemanticFingerprint(request.elements),
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
            affected_element_count: 0,
            affected_element_ids: [],
            affected_ids_truncated: false,
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
        this.revisions.markAgentCommitStarted();
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
        await this.waitForEditorSettle();
        const actual = [...api.getSceneElementsIncludingDeleted()];
        this.revisions.observe(actual);
        if (computed.isApplied && !computed.isApplied(actual)) {
          this.revisions.reclassifyLastChangeAsHuman();
          this.emitStatus();
          return staleResult(this.revisions.getSnapshot().revision);
        }
        const revisionAfter = Math.max(
          settled.revision,
          this.revisions.getSnapshot().revision,
        );
        this.emitStatus();
        return {
          ok: true,
          operation: input.operation,
          changed: true,
          revision_before: before,
          revision_after: revisionAfter,
          affected_element_count: computed.affectedIds.length,
          affected_element_ids: computed.affectedIds.slice(
            0,
            TOOL_LIMITS.maxReceiptIds,
          ),
          affected_ids_truncated:
            computed.affectedIds.length > TOOL_LIMITS.maxReceiptIds,
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

  private pageElements(
    elements: CanvasElement[],
    input: CanvasReadInput,
    payload: Record<string, unknown>,
  ): ToolResult<Record<string, unknown>> {
    const revision = this.revisions.getSnapshot().revision;
    let offset = 0;
    if (input.cursor) {
      const [cursorRevision, cursorOffset] = input.cursor
        .split(":")
        .map((value) => Number(value));
      if (cursorRevision !== revision) return staleResult(revision);
      if (!Number.isSafeInteger(cursorOffset) || cursorOffset < 0) {
        return invalidResult("The canvas cursor offset is invalid.");
      }
      offset = cursorOffset;
    }
    if (offset > elements.length) {
      return invalidResult("The canvas cursor is past the end of the scene.");
    }

    const limit = input.limit ?? TOOL_LIMITS.maxReadPageSize;
    const available = Math.min(limit, elements.length - offset);
    let accepted: ReturnType<typeof projectElement>[] = [];
    let acceptedResult: Record<string, unknown> | undefined;
    for (let count = 0; count <= available; count += 1) {
      const candidate = elements
        .slice(offset, offset + count)
        .map(projectElement);
      const nextOffset = offset + candidate.length;
      const hasMore = nextOffset < elements.length;
      const result = {
        ok: true,
        revision,
        ...payload,
        elements: candidate,
        truncated: hasMore,
        ...(hasMore ? { next_cursor: `${revision}:${nextOffset}` } : {}),
      };
      if (serializedToolResultLength(result) > MAX_TOOL_RESULT_CHARACTERS) {
        break;
      }
      accepted = candidate;
      acceptedResult = result;
    }

    if (!acceptedResult || (available > 0 && accepted.length === 0)) {
      return outputTooLargeResult();
    }
    return acceptedResult as ToolResult<Record<string, unknown>>;
  }

  private emitStatus(): void {
    const status = this.getStatus();
    for (const listener of this.listeners) listener(status);
  }
}
