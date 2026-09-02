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
      screen.getByText(/no end-to-end winner/),
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
    expect(
      screen.getByRole("heading", { name: "Every Excalidraw shortcut stays native" }),
    ).toBeInTheDocument();
  });

  it("renders controlled evidence without claiming an end-to-end winner", () => {
    render(<BenchmarksPage />);
    expect(screen.getByText("Semantic trial success")).toBeInTheDocument();
    expect(screen.getByText("220/220")).toBeInTheDocument();
    expect(
      screen.getByText("Official MCP checkpoint component"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "The controlled run is complete. The host journey remains open.",
      }),
    ).toBeInTheDocument();
  });
});
