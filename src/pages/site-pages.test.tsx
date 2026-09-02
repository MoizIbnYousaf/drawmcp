import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BenchmarksPage } from "./BenchmarksPage";
import { DocsPage } from "./DocsPage";
import { HomePage } from "./HomePage";

afterEach(() => vi.restoreAllMocks());

describe("DrawMCP site pages", () => {
  it("uses Moiz's approved copy and the verified protocol comparison", () => {
    const { container } = render(<HomePage />);
    expect(
      screen.getByRole("heading", {
        name: "Official Excalidraw MCP vs DrawMCP WebMCP",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "DrawMCP is a WebMCP fork of the current Excalidraw MCP that allows the interactive use of Excalidraw.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Draw through the normal Excalidraw controls. The agent interacts via WebMCP.",
      ),
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
    ).toEqual(["/videos/mcp-vs-webmcp.mp4"]);
    expect(
      screen.getByRole("button", { name: "Play comparison video" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute(
      "href",
      "#main-content",
    );
    expect(container.querySelector("#main-content")).toHaveAttribute(
      "tabindex",
      "-1",
    );
    expect(screen.getAllByRole("link", { name: /Results/ })).not.toHaveLength(0);
    expect(screen.queryByText(/tic-tac-toe/i)).not.toBeInTheDocument();
  });

  it("lets the viewer pause and resume the autoplay comparison", () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockResolvedValue();
    const pause = vi
      .spyOn(HTMLMediaElement.prototype, "pause")
      .mockImplementation(() => undefined);
    render(<HomePage />);
    const video = screen.getByTestId("comparison-video");

    Object.defineProperty(video, "paused", { configurable: true, value: false });
    fireEvent.click(
      screen.getByRole("button", { name: "Play comparison video" }),
    );
    expect(pause).toHaveBeenCalledOnce();

    Object.defineProperty(video, "paused", { configurable: true, value: true });
    fireEvent.click(
      screen.getByRole("button", { name: "Play comparison video" }),
    );
    expect(play).toHaveBeenCalledOnce();
  });

  it("documents both the page-native and official MCP setup", () => {
    render(<DocsPage />);
    expect(
      screen.getByRole("heading", { name: "Use DrawMCP in ChatGPT" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Why DrawMCP",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("https://mcp.excalidraw.com")).toBeInTheDocument();
    expect(screen.getByText("get_canvas_summary")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Open the DrawMCP canvas in ChatGPT's in-app browser. Ask the agent to use Excalidraw.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Every Excalidraw shortcut stays native" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/tic-tac-toe/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/wait for the status pill/i)).not.toBeInTheDocument();
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
    expect(screen.getByRole("link", { name: "Open DrawMCP ↗" })).toHaveAttribute(
      "href",
      "/canvas",
    );
    expect(screen.queryByText(/tic-tac-toe/i)).not.toBeInTheDocument();
  });
});
