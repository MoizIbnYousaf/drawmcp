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
  const boundTextIds = new Set(
    elements
      .filter(
        (element) =>
          typeof element.containerId === "string" &&
          deltas.has(element.containerId),
      )
      .map(({ id }) => id),
  );
  const skippedIds = elements
    .filter(
      (element) =>
        targetIds.has(element.id) &&
        !SUPPORTED_NODE_TYPES.has(element.type) &&
        !boundTextIds.has(element.id),
    )
    .map(({ id }) => id);

  return {
    elements: elements.map((element) => {
      const position = positions.get(element.id);
      if (position) return { ...element, ...position };
      if (typeof element.containerId === "string") {
        const delta = deltas.get(element.containerId);
        if (delta) {
          return { ...element, x: element.x + delta.x, y: element.y + delta.y };
        }
      }
      return element;
    }),
    movedIds: [...targets.map(({ id }) => id), ...boundTextIds],
    skippedIds,
  };
};
