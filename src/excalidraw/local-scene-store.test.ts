import { beforeEach, describe, expect, it } from "vitest";
import {
  LOCAL_SCENE_MAX_CHARACTERS,
  LOCAL_SCENE_STORAGE_KEY,
  clearLocalScene,
  loadLocalScene,
  saveLocalScene,
} from "./local-scene-store";

const rectangle = (id = "node") => ({
  id,
  type: "rectangle",
  x: 10,
  y: 20,
  width: 100,
  height: 60,
});

describe("local scene recovery", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips non-file elements and allowlisted viewport state", () => {
    expect(
      saveLocalScene(localStorage, [rectangle()], {
        scrollX: 12,
        scrollY: -8,
        zoom: { value: 1.25 },
        selectedElementIds: { node: true },
      }),
    ).toBe(true);
    expect(loadLocalScene(localStorage)).toEqual({
      elements: [rectangle()],
      appState: { scrollX: 12, scrollY: -8, zoom: { value: 1.25 } },
    });
  });

  it("drops deleted and file-backed elements", () => {
    expect(
      saveLocalScene(
        localStorage,
        [
          rectangle("live"),
          { ...rectangle("deleted"), isDeleted: true },
          { ...rectangle("image"), type: "image", fileId: "file" },
        ],
        {},
      ),
    ).toBe(true);
    expect(loadLocalScene(localStorage)?.elements).toEqual([rectangle("live")]);
  });

  it("clears storage when the live scene is empty", () => {
    localStorage.setItem(LOCAL_SCENE_STORAGE_KEY, "existing");
    expect(saveLocalScene(localStorage, [], {})).toBe(true);
    expect(localStorage.getItem(LOCAL_SCENE_STORAGE_KEY)).toBeNull();
  });

  it.each([
    ["invalid JSON", "{"],
    ["unknown version", JSON.stringify({ version: 2, elements: [] })],
    [
      "invalid element",
      JSON.stringify({ version: 1, elements: [{ id: "x" }] }),
    ],
    ["oversized data", "x".repeat(LOCAL_SCENE_MAX_CHARACTERS + 1)],
  ])("rejects %s", (_label, value) => {
    localStorage.setItem(LOCAL_SCENE_STORAGE_KEY, value);
    expect(loadLocalScene(localStorage)).toBeNull();
  });

  it("handles storage write failures without throwing", () => {
    const storage = {
      getItem: () => null,
      removeItem: () => undefined,
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(saveLocalScene(storage, [rectangle()], {})).toBe(false);
  });

  it("clears the documented storage key", () => {
    localStorage.setItem(LOCAL_SCENE_STORAGE_KEY, "existing");
    clearLocalScene(localStorage);
    expect(localStorage.getItem(LOCAL_SCENE_STORAGE_KEY)).toBeNull();
  });

  it("supports an isolated scene namespace", () => {
    const gameKey = "drawmcp:test-game:v1";
    expect(saveLocalScene(localStorage, [rectangle("game")], {}, gameKey)).toBe(
      true,
    );
    expect(localStorage.getItem(LOCAL_SCENE_STORAGE_KEY)).toBeNull();
    expect(loadLocalScene(localStorage, gameKey)?.elements).toEqual([
      rectangle("game"),
    ]);
    clearLocalScene(localStorage, gameKey);
    expect(localStorage.getItem(gameKey)).toBeNull();
  });
});
