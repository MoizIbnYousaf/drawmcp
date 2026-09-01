import { TOOL_LIMITS } from "../webmcp/tool-contracts";

export type CanvasElement = Record<string, unknown> & {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isDeleted?: boolean;
};

export type ProjectedElement = {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle?: number;
  text?: string;
  stroke_color?: string;
  background_color?: string;
  opacity?: number;
  locked?: boolean;
  container_id?: string | null;
  start_binding_id?: string | null;
  end_binding_id?: string | null;
  points?: unknown;
};

export type SceneBounds = {
  min_x: number;
  min_y: number;
  max_x: number;
  max_y: number;
  width: number;
  height: number;
};

const optionalString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const bindingId = (value: unknown): string | null | undefined => {
  if (value === null) return null;
  if (!value || typeof value !== "object") return undefined;
  const elementId = (value as { elementId?: unknown }).elementId;
  return typeof elementId === "string" ? elementId : undefined;
};

export const projectElement = (element: CanvasElement): ProjectedElement => {
  const projected: ProjectedElement = {
    id: element.id,
    type: element.type,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
  };

  if (typeof element.angle === "number") projected.angle = element.angle;
  const text = optionalString(element.text);
  if (text !== undefined)
    projected.text = text.slice(0, TOOL_LIMITS.maxTextLength);
  const strokeColor = optionalString(element.strokeColor);
  if (strokeColor !== undefined) projected.stroke_color = strokeColor;
  const backgroundColor = optionalString(element.backgroundColor);
  if (backgroundColor !== undefined)
    projected.background_color = backgroundColor;
  if (typeof element.opacity === "number") projected.opacity = element.opacity;
  if (typeof element.locked === "boolean") projected.locked = element.locked;
  if (typeof element.containerId === "string" || element.containerId === null) {
    projected.container_id = element.containerId as string | null;
  }
  const startBindingId = bindingId(element.startBinding);
  if (startBindingId !== undefined) projected.start_binding_id = startBindingId;
  const endBindingId = bindingId(element.endBinding);
  if (endBindingId !== undefined) projected.end_binding_id = endBindingId;
  if (Array.isArray(element.points)) projected.points = element.points;
  return projected;
};

export const getSceneBounds = (
  elements: CanvasElement[],
): SceneBounds | null => {
  if (elements.length === 0) return null;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const element of elements) {
    minX = Math.min(minX, element.x);
    minY = Math.min(minY, element.y);
    maxX = Math.max(maxX, element.x + element.width);
    maxY = Math.max(maxY, element.y + element.height);
  }
  return {
    min_x: minX,
    min_y: minY,
    max_x: maxX,
    max_y: maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

export const summarizeElements = (elements: CanvasElement[], limit: number) => {
  const liveElements = elements.filter((element) => !element.isDeleted);
  const counts = liveElements.reduce<Record<string, number>>((acc, element) => {
    acc[element.type] = (acc[element.type] ?? 0) + 1;
    return acc;
  }, {});
  return {
    element_count: liveElements.length,
    counts,
    bounds: getSceneBounds(liveElements),
    elements: liveElements.slice(0, limit).map(projectElement),
    truncated: liveElements.length > limit,
  };
};
