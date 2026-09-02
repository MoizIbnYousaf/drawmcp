import type { CanvasElement } from "./element-projection";

export const LOCAL_SCENE_STORAGE_KEY = "drawmcp:scene:v1";
export const LOCAL_SCENE_MAX_CHARACTERS = 1_000_000;
const LOCAL_SCENE_VERSION = 1;
const MAX_PERSISTED_ELEMENTS = 5_000;

export type StorageLike = Pick<Storage, "getItem" | "removeItem" | "setItem">;

type PersistedAppState = {
  scrollX?: number;
  scrollY?: number;
  zoom?: { value: number };
};

export type LocalScene = {
  elements: CanvasElement[];
  appState: PersistedAppState;
};

const finiteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isPersistableElement = (value: unknown): value is CanvasElement => {
  if (!value || typeof value !== "object") return false;
  const element = value as Record<string, unknown>;
  return (
    typeof element.id === "string" &&
    element.id.length > 0 &&
    typeof element.type === "string" &&
    element.type.length > 0 &&
    element.type !== "image" &&
    typeof element.fileId !== "string" &&
    finiteNumber(element.x) &&
    finiteNumber(element.y) &&
    finiteNumber(element.width) &&
    element.width >= 0 &&
    finiteNumber(element.height) &&
    element.height >= 0
  );
};

const projectAppState = (value: Record<string, unknown>): PersistedAppState => {
  const appState: PersistedAppState = {};
  if (finiteNumber(value.scrollX)) appState.scrollX = value.scrollX;
  if (finiteNumber(value.scrollY)) appState.scrollY = value.scrollY;
  if (value.zoom && typeof value.zoom === "object") {
    const zoom = (value.zoom as { value?: unknown }).value;
    if (finiteNumber(zoom) && zoom > 0 && zoom <= 30) {
      appState.zoom = { value: zoom };
    }
  }
  return appState;
};

export const clearLocalScene = (storage: StorageLike): void => {
  try {
    storage.removeItem(LOCAL_SCENE_STORAGE_KEY);
  } catch {
    // Local recovery is optional and must never break the editor.
  }
};

export const saveLocalScene = (
  storage: StorageLike,
  elements: readonly CanvasElement[],
  appState: Record<string, unknown>,
): boolean => {
  const live = elements.filter(
    (element) => !element.isDeleted && isPersistableElement(element),
  );
  if (live.length === 0) {
    clearLocalScene(storage);
    return true;
  }
  if (live.length > MAX_PERSISTED_ELEMENTS) return false;

  const serialized = JSON.stringify({
    version: LOCAL_SCENE_VERSION,
    saved_at: new Date().toISOString(),
    elements: live,
    app_state: projectAppState(appState),
  });
  if (Array.from(serialized).length > LOCAL_SCENE_MAX_CHARACTERS) return false;
  try {
    storage.setItem(LOCAL_SCENE_STORAGE_KEY, serialized);
    return true;
  } catch {
    return false;
  }
};

export const loadLocalScene = (storage: StorageLike): LocalScene | null => {
  let serialized: string | null;
  try {
    serialized = storage.getItem(LOCAL_SCENE_STORAGE_KEY);
  } catch {
    return null;
  }
  if (!serialized || Array.from(serialized).length > LOCAL_SCENE_MAX_CHARACTERS) {
    return null;
  }

  try {
    const parsed = JSON.parse(serialized) as Record<string, unknown>;
    if (parsed.version !== LOCAL_SCENE_VERSION || !Array.isArray(parsed.elements)) {
      return null;
    }
    if (
      parsed.elements.length > MAX_PERSISTED_ELEMENTS ||
      !parsed.elements.every(isPersistableElement)
    ) {
      return null;
    }
    const appState =
      parsed.app_state && typeof parsed.app_state === "object"
        ? projectAppState(parsed.app_state as Record<string, unknown>)
        : {};
    return {
      elements: parsed.elements as CanvasElement[],
      appState,
    };
  } catch {
    return null;
  }
};

