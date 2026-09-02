import type { AddElementsInput } from "../webmcp/tool-contracts";

export const TIC_TAC_TOE_STORAGE_KEY = "drawmcp:tic-tac-toe:v1";

export const TIC_TAC_TOE_ELEMENTS: AddElementsInput["elements"] = [
  {
    id: "ttt_title",
    type: "text",
    x: 230,
    y: 20,
    text: "Moiz = X    Codex = O",
    fontSize: 32,
    strokeColor: "#1e1e1e",
    locked: true,
  },
  {
    id: "ttt_hint",
    type: "text",
    x: 255,
    y: 65,
    text: "Draw an X, then ask the agent to play.",
    fontSize: 20,
    strokeColor: "#6e675f",
    locked: true,
  },
  {
    id: "ttt_v1",
    type: "line",
    x: 360,
    y: 120,
    points: [[0, 0], [0, 540]],
    strokeColor: "#1e1e1e",
    strokeWidth: 4,
    roughness: 1,
    locked: true,
  },
  {
    id: "ttt_v2",
    type: "line",
    x: 540,
    y: 120,
    points: [[0, 0], [0, 540]],
    strokeColor: "#1e1e1e",
    strokeWidth: 4,
    roughness: 1,
    locked: true,
  },
  {
    id: "ttt_h1",
    type: "line",
    x: 180,
    y: 300,
    points: [[0, 0], [540, 0]],
    strokeColor: "#1e1e1e",
    strokeWidth: 4,
    roughness: 1,
    locked: true,
  },
  {
    id: "ttt_h2",
    type: "line",
    x: 180,
    y: 480,
    points: [[0, 0], [540, 0]],
    strokeColor: "#1e1e1e",
    strokeWidth: 4,
    roughness: 1,
    locked: true,
  },
];

export const TIC_TAC_TOE_AGENT_PROMPT =
  "We are playing tic-tac-toe on this canvas. I am X and you are O. Read the full board, choose one legal empty cell, add a blue O centered in that cell, and fit the view. Keep the grid and every existing move unchanged.";
