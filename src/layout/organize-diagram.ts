import type { CanvasElement } from "../excalidraw/element-projection";
import type { OrganizeDiagramInput } from "../webmcp/tool-contracts";

const SUPPORTED_NODE_TYPES = new Set([
  "rectangle",
  "ellipse",
  "diamond",
  "text",
]);

export type OrganizeResult = {
  elements: CanvasElement[];
  movedIds: string[];
  skippedIds: string[];
};

const bindingElementId = (value: unknown): string | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const elementId = (value as { elementId?: unknown }).elementId;
  return typeof elementId === "string" ? elementId : undefined;
};

const isFinitePoint = (value: unknown): value is [number, number] =>
  Array.isArray(value) &&
  value.length === 2 &&
  typeof value[0] === "number" &&
  Number.isFinite(value[0]) &&
  typeof value[1] === "number" &&
  Number.isFinite(value[1]);

export const organizeDiagram = (
  elements: CanvasElement[],
  targetIds: Set<string>,
  layout: OrganizeDiagramInput["layout"],
  spacing: number,
): OrganizeResult => {
  const targets = elements.filter(
    (element) =>
      targetIds.has(element.id) &&
      SUPPORTED_NODE_TYPES.has(element.type) &&
      typeof element.containerId !== "string" &&
      !element.isDeleted,
  );
  if (targets.length === 0) {
    return {
      elements: [...elements],
      movedIds: [],
      skippedIds: elements
        .filter((element) => targetIds.has(element.id))
        .map(({ id }) => id),
    };
  }

  const originX = Math.min(...targets.map(({ x }) => x));
  const originY = Math.min(...targets.map(({ y }) => y));
  const columns = layout === "grid" ? Math.ceil(Math.sqrt(targets.length)) : 1;
  const maxWidth = Math.max(...targets.map(({ width }) => width));
  const maxHeight = Math.max(...targets.map(({ height }) => height));
  let horizontalCursor = originX;
  let verticalCursor = originY;

  const positions = new Map<string, { x: number; y: number }>();
  targets.forEach((element, index) => {
    if (layout === "horizontal") {
      positions.set(element.id, { x: horizontalCursor, y: originY });
      horizontalCursor += element.width + spacing;
      return;
    }
    if (layout === "vertical") {
      positions.set(element.id, { x: originX, y: verticalCursor });
      verticalCursor += element.height + spacing;
      return;
    }
    positions.set(element.id, {
      x: originX + (index % columns) * (maxWidth + spacing),
      y: originY + Math.floor(index / columns) * (maxHeight + spacing),
    });
  });

  const deltas = new Map(
    targets.map((element) => {
      const position = positions.get(element.id)!;
      return [
        element.id,
        { x: position.x - element.x, y: position.y - element.y },
      ];
    }),
  );
  const movedTargetIds = new Set(
    targets
      .filter((element) => {
        const delta = deltas.get(element.id)!;
        return delta.x !== 0 || delta.y !== 0;
      })
      .map(({ id }) => id),
  );
  const boundTextIds = new Set(
    elements
      .filter(
        (element) =>
          typeof element.containerId === "string" &&
          movedTargetIds.has(element.containerId),
      )
      .map(({ id }) => id),
  );
  const connectorIds = new Set<string>();
  const movedElements = elements.map((element) => {
    const position = positions.get(element.id);
    if (position) return { ...element, ...position };
    if (typeof element.containerId === "string") {
      const delta = deltas.get(element.containerId);
      if (delta && movedTargetIds.has(element.containerId)) {
        return { ...element, x: element.x + delta.x, y: element.y + delta.y };
      }
    }
    return element;
  });

  const connectedElements = movedElements.map((element, index) => {
    if (element.type !== "arrow" && element.type !== "line") return element;
    const original = elements[index];
    const points = Array.isArray(original.points)
      ? original.points.filter(isFinitePoint)
      : [];
    if (points.length < 2) return element;

    const startId = bindingElementId(original.startBinding);
    const endId = bindingElementId(original.endBinding);
    const startDelta = (startId && deltas.get(startId)) || { x: 0, y: 0 };
    const endDelta = (endId && deltas.get(endId)) || { x: 0, y: 0 };
    if (
      startDelta.x === 0 &&
      startDelta.y === 0 &&
      endDelta.x === 0 &&
      endDelta.y === 0
    ) {
      return element;
    }

    const first = points[0];
    const start = {
      x: original.x + first[0] + startDelta.x,
      y: original.y + first[1] + startDelta.y,
    };
    const adjustedPoints = points.map((point, pointIndex) => {
      const progress = pointIndex / (points.length - 1);
      const shiftX = startDelta.x + (endDelta.x - startDelta.x) * progress;
      const shiftY = startDelta.y + (endDelta.y - startDelta.y) * progress;
      return [
        original.x + point[0] + shiftX - start.x,
        original.y + point[1] + shiftY - start.y,
      ];
    });
    const xs = adjustedPoints.map(([x]) => x);
    const ys = adjustedPoints.map(([, y]) => y);
    connectorIds.add(element.id);
    return {
      ...element,
      x: start.x,
      y: start.y,
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
      points: adjustedPoints,
    };
  });
  const skippedIds = elements
    .filter(
      (element) =>
        targetIds.has(element.id) &&
        !SUPPORTED_NODE_TYPES.has(element.type) &&
        !boundTextIds.has(element.id) &&
        !connectorIds.has(element.id),
    )
    .map(({ id }) => id);

  return {
    elements: connectedElements,
    movedIds: [...movedTargetIds, ...boundTextIds, ...connectorIds],
    skippedIds,
  };
};
