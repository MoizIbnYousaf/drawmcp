import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BenchmarksPage } from "./BenchmarksPage";
import { DocsPage } from "./DocsPage";
import { HomePage } from "./HomePage";

describe("DrawMCP site pages", () => {
  it("presents the two protocol lanes without declaring a winner", () => {
    const { container } = render(<HomePage />);
    expect(
      screen.getByRole("heading", {
        name: "Two valid ways to give an agent a pencil.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Official Excalidraw MCP")).toBeInTheDocument();
    expect(screen.getByText("DrawMCP WebMCP")).toBeInTheDocument();
    expect(
      screen.getByText(/different measurement boundaries/),
    ).toBeInTheDocument();

    const videos = screen.getAllByTestId("comparison-video");
    expect(videos).toHaveLength(2);
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
    ).toEqual([
      "/videos/official-mcp.mp4",
      "/videos/drawmcp-webmcp.mp4",
    ]);
  });

  it("documents both the page-native and official MCP setup", () => {
    render(<DocsPage />);
    expect(
      screen.getByRole("heading", { name: "Use DrawMCP in ChatGPT" }),
    ).toBeInTheDocument();
    expect(screen.getByText("https://mcp.excalidraw.com")).toBeInTheDocument();
    expect(screen.getByText("get_canvas_summary")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Verify the shared canvas in 90 seconds" }),
    ).toBeInTheDocument();
  });

  it("labels incomplete benchmark evidence as pending", () => {
    render(<BenchmarksPage />);
    expect(screen.getByText("Controlled paired runs")).toBeInTheDocument();
    expect(screen.getByText("Not published yet")).toBeInTheDocument();
    expect(
      screen.getByText("Official MCP direct SDK transport"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "The WebMCP implementation works. The race has not been run.",
      }),
    ).toBeInTheDocument();
  });
});
