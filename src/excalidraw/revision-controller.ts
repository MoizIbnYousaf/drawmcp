import type { CanvasElement } from "./element-projection";

export type RevisionActor = "human" | "agent";

export type RevisionSnapshot = {
  revision: number;
  lastActor: RevisionActor | null;
  lastOperation: string | null;
};

type PendingChange = {
  operation: string;
  expectedFingerprint: string;
  resolve: (snapshot: { revision: number; actor: "agent" }) => void;
  reject: (error: Error) => void;
};

const semanticElement = (element: CanvasElement) => ({
  id: element.id,
  type: element.type,
  isDeleted: Boolean(element.isDeleted),
  x: element.x,
  y: element.y,
  width: element.width,
  height: element.height,
  angle: element.angle,
  text: element.text,
  points: element.points,
  strokeColor: element.strokeColor,
  backgroundColor: element.backgroundColor,
  fillStyle: element.fillStyle,
  strokeWidth: element.strokeWidth,
  strokeStyle: element.strokeStyle,
  roughness: element.roughness,
  opacity: element.opacity,
  locked: element.locked,
  containerId: element.containerId,
  startBinding: element.startBinding,
  endBinding: element.endBinding,
});

export const sceneFingerprint = (elements: CanvasElement[]): string =>
  JSON.stringify(elements.map(semanticElement));

export class RevisionController {
  private revision = 0;
  private lastActor: RevisionActor | null = null;
  private lastOperation: string | null = null;
  private fingerprint?: string;
  private pending?: PendingChange;

  observe(elements: CanvasElement[]): RevisionSnapshot {
    const nextFingerprint = sceneFingerprint(elements);
    if (this.fingerprint === undefined) {
      this.fingerprint = nextFingerprint;
      return this.getSnapshot();
    }
    if (nextFingerprint === this.fingerprint) return this.getSnapshot();

    this.fingerprint = nextFingerprint;
    this.revision += 1;
    if (this.pending?.expectedFingerprint === nextFingerprint) {
      const pending = this.pending;
      this.pending = undefined;
      this.lastActor = "agent";
      this.lastOperation = pending.operation;
      pending.resolve({ revision: this.revision, actor: "agent" });
    } else {
      const pending = this.pending;
      this.pending = undefined;
      this.lastActor = "human";
      this.lastOperation = "human_edit";
      pending?.reject(
        new Error("The canvas changed while the agent operation was applying."),
      );
    }
    return this.getSnapshot();
  }

  expectAgentChange(
    operation: string,
    elements: CanvasElement[],
  ): Promise<{ revision: number; actor: "agent" }> {
    if (this.pending)
      throw new Error("Another agent operation is already pending.");
    return new Promise((resolve, reject) => {
      this.pending = {
        operation,
        expectedFingerprint: sceneFingerprint(elements),
        resolve,
        reject,
      };
    });
  }

  cancelPending(reason: string): void {
    const pending = this.pending;
    this.pending = undefined;
    pending?.reject(new Error(reason));
  }

  getSnapshot(): RevisionSnapshot {
    return {
      revision: this.revision,
      lastActor: this.lastActor,
      lastOperation: this.lastOperation,
    };
  }
}
