export const TOOL_NAMES = [
  "get_canvas_summary",
  "get_selection",
  "add_elements",
  "update_elements",
  "delete_elements",
  "fit_to_content",
  "organize_diagram",
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];
