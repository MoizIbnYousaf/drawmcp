import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BenchmarksPage } from "./BenchmarksPage";
import { DocsPage } from "./DocsPage";
import { HomePage } from "./HomePage";

describe("DrawMCP site pages", () => {
  it("leads with the shared game and verified live speedup", () => {
    const { container } = render(<HomePage />);
    expect(
      screen.getByRole("heading", {
        name: "You play X. The agent sees it.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "6.58× faster on the task we measured.",
      }),
    ).toBeInTheDocument();

    const videos = screen.getAllByTestId("comparison-video");
    expect(videos).toHaveLength(1);
    for (const video of videos) {
      expect(video).toHaveAttribute("autoplay");
      expect(video).toHaveAttribute("loop");
      expect((video as HTMLVideoElement).muted).toBe(true);
      expect(video).toHaveAttribute("playsinline");
      expect(video).not.toHaveAttribute("controls");
    }
    expect(
      Array.from(container.querySelectorAll("video source"), (source) =>
        source.getAttribute("src"),
      ),
    ).toEqual(["/videos/tic-tac-toe.mp4"]);
  });

  it("documents both the page-native and official MCP setup", () => {
    render(<DocsPage />);
    expect(
      screen.getByRole("heading", { name: "Use DrawMCP in ChatGPT" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "The interesting part was never drawing a rectangle",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("https://mcp.excalidraw.com")).toBeInTheDocument();
    expect(screen.getByText("get_canvas_summary")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Verify the shared canvas in 90 seconds" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Play one board with the agent" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Every Excalidraw shortcut stays native" }),
    ).toBeInTheDocument();
  });

  it("renders accepted live evidence with its exact task boundary", () => {
    render(<BenchmarksPage />);
    expect(screen.getByText("Semantic success")).toBeInTheDocument();
    expect(screen.getByText("40/40")).toBeInTheDocument();
    expect(screen.getByText("DrawMCP WebMCP p50")).toBeInTheDocument();
    expect(screen.getByText("Official public MCP p50")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Every WebMCP call appears on the browser timeline.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Show custom tracks")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Play tic-tac-toe ↗" }),
    ).toBeInTheDocument();
  });
});
