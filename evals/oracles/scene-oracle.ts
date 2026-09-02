export type ProjectedSceneElement = Record<string, unknown> & {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type NormalizedNode = {
  id: string;
  type: string;
  label?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  background_color?: string;
};

export type NormalizedEdge = {
  id: string;
  type: string;
  from?: string;
  to?: string;
};

export type SceneExpectation = {
  nodes: Array<{
    id: string;
    type?: string;
    label?: string;
    x?: number;
    y?: number;
    background_color?: string;
  }>;
  edges?: Array<{ from: string; to: string; type?: string }>;
  tolerance?: number;
};

export type SceneEvaluation = {
  ok: boolean;
  score: number;
  checks: number;
  passed: number;
  failures: string[];
};

const NODE_TYPES = new Set(["rectangle", "ellipse", "diamond"]);
const EDGE_TYPES = new Set(["arrow", "line"]);

const optionalString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const nestedString = (value: unknown, key: string): string | undefined => {
  if (!value || typeof value !== "object") return undefined;
  return optionalString((value as Record<string, unknown>)[key]);
};

export const normalizeScene = (elements: ProjectedSceneElement[]) => {
  const labels = new Map(
    elements
      .filter(
        (element) =>
          element.type === "text" &&
          typeof element.container_id === "string" &&
          typeof element.text === "string",
      )
      .map((element) => [String(element.container_id), String(element.text)]),
  );
  const nodes: NormalizedNode[] = elements
    .filter((element) => NODE_TYPES.has(element.type))
    .map((element) => ({
      id: element.id,
      type: element.type,
      ...(labels.has(element.id) || nestedString(element.label, "text")
        ? {
            label:
              labels.get(element.id) ?? nestedString(element.label, "text"),
          }
        : {}),
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      ...(optionalString(element.background_color)
        ? { background_color: String(element.background_color) }
        : {}),
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
  const edges: NormalizedEdge[] = elements
    .filter((element) => EDGE_TYPES.has(element.type))
    .map((element) => ({
      id: element.id,
      type: element.type,
      ...(optionalString(element.start_binding_id) ||
      nestedString(element.startBinding, "elementId") ||
      nestedString(element.start, "id")
        ? {
            from:
              optionalString(element.start_binding_id) ??
              nestedString(element.startBinding, "elementId") ??
              nestedString(element.start, "id"),
          }
        : {}),
      ...(optionalString(element.end_binding_id) ||
      nestedString(element.endBinding, "elementId") ||
      nestedString(element.end, "id")
        ? {
            to:
              optionalString(element.end_binding_id) ??
              nestedString(element.endBinding, "elementId") ??
              nestedString(element.end, "id"),
          }
        : {}),
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
  return { nodes, edges };
};

export const evaluateScene = (
  elements: ProjectedSceneElement[],
  expected: SceneExpectation,
): SceneEvaluation => {
  const scene = normalizeScene(elements);
  const tolerance = expected.tolerance ?? 5;
  const failures: string[] = [];
  let checks = 0;
  let passed = 0;

  for (const requirement of expected.nodes) {
    checks += 1;
    const node = scene.nodes.find(({ id }) => id === requirement.id);
    if (!node) {
      failures.push(`Missing node ${requirement.id}.`);
      continue;
    }
    const mismatch =
      (requirement.type !== undefined && node.type !== requirement.type) ||
      (requirement.label !== undefined && node.label !== requirement.label) ||
      (requirement.x !== undefined &&
        Math.abs(node.x - requirement.x) > tolerance) ||
      (requirement.y !== undefined &&
        Math.abs(node.y - requirement.y) > tolerance) ||
      (requirement.background_color !== undefined &&
        node.background_color !== requirement.background_color);
    if (mismatch) {
      if (requirement.label !== undefined && node.label !== requirement.label) {
        failures.push(
          `${requirement.id} label was ${JSON.stringify(node.label)}, expected ${JSON.stringify(requirement.label)}.`,
        );
      } else {
        failures.push(`Node ${requirement.id} did not match its required semantics.`);
      }
      continue;
    }
    passed += 1;
  }

  for (const requirement of expected.edges ?? []) {
    checks += 1;
    const edge = scene.edges.find(
      ({ from, to, type }) =>
        from === requirement.from &&
        to === requirement.to &&
        (requirement.type === undefined || type === requirement.type),
    );
    if (!edge) {
      failures.push(`Missing edge ${requirement.from} -> ${requirement.to}.`);
      continue;
    }
    passed += 1;
  }

  return {
    ok: failures.length === 0,
    score: checks === 0 ? 1 : passed / checks,
    checks,
    passed,
    failures,
  };
};
