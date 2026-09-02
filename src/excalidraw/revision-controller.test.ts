import { describe, expect, it } from "vitest";
import { RevisionController } from "./revision-controller";

const scene = (x: number) => [
  { id: "node", type: "rectangle", x, y: 0, width: 100, height: 50 },
];

describe("RevisionController", () => {
  it("establishes an initial baseline without advancing", () => {
    const controller = new RevisionController();
    controller.observe(scene(0));
    expect(controller.getSnapshot()).toMatchObject({
      revision: 0,
      lastActor: null,
    });
  });

  it("advances unmatched semantic changes as human edits", () => {
    const controller = new RevisionController();
    controller.observe(scene(0));
    controller.observe(scene(20));
    expect(controller.getSnapshot()).toMatchObject({
      revision: 1,
      lastActor: "human",
    });
  });

  it.each([
    ["font size", { fontSize: 28 }],
    ["arrowhead", { endArrowhead: "triangle" }],
    ["group membership", { groupIds: ["group_1"] }],
    ["link", { link: "https://example.com" }],
    ["roundness", { roundness: { type: 3 } }],
  ])("advances when %s changes", (_label, change) => {
    const controller = new RevisionController();
    const initial = scene(0);
    controller.observe(initial);
    controller.observe([{ ...initial[0], ...change }]);
    expect(controller.getSnapshot()).toMatchObject({
      revision: 1,
      lastActor: "human",
    });
  });

  it("advances when element order changes", () => {
    const controller = new RevisionController();
    const first = scene(0)[0];
    const second = { ...first, id: "node_2", x: 200 };
    controller.observe([first, second]);
    controller.observe([second, first]);
    expect(controller.getSnapshot()).toMatchObject({
      revision: 1,
      lastActor: "human",
    });
  });

  it("settles an expected agent change exactly once", async () => {
    const controller = new RevisionController();
    controller.observe(scene(0));
    const pending = controller.expectAgentChange("move_node", scene(20));
    controller.observe(scene(20));
    controller.observe(scene(20));
    expect(controller.getSnapshot()).toMatchObject({
      revision: 1,
      lastActor: "agent",
      lastOperation: "move_node",
    });
    await expect(pending).resolves.toMatchObject({
      revision: 1,
      actor: "agent",
    });
  });

  it("rejects a pending agent change when a different human edit wins", async () => {
    const controller = new RevisionController();
    controller.observe(scene(0));
    const pending = controller.expectAgentChange("move_node", scene(20));
    controller.observe(scene(30));
    await expect(pending).rejects.toThrow(
      "changed while the agent operation was applying",
    );
    expect(controller.getSnapshot()).toMatchObject({
      revision: 1,
      lastActor: "human",
    });
  });
});
