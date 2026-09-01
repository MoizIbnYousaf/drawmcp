import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BenchmarksPage } from "./BenchmarksPage";
import { DocsPage } from "./DocsPage";
import { HomePage } from "./HomePage";

describe("DrawMCP site pages", () => {
  it("presents the two protocol lanes without declaring a winner", () => {
    render(<HomePage />);
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
  });

  it("documents both the page-native and official MCP setup", () => {
    render(<DocsPage />);
    expect(
      screen.getByRole("heading", { name: "Use DrawMCP in ChatGPT" }),
    ).toBeInTheDocument();
    expect(screen.getByText("https://mcp.excalidraw.com")).toBeInTheDocument();
    expect(screen.getByText("get_canvas_summary")).toBeInTheDocument();
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
