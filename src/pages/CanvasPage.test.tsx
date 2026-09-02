import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CanvasPage } from "./CanvasPage";

vi.mock("../components/DrawMcpCanvas", () => ({
  DrawMcpCanvas: () => <div data-testid="ordinary-drawmcp-canvas" />,
}));

describe("CanvasPage", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/canvas");
  });

  it("renders the ordinary canvas", async () => {
    render(<CanvasPage />);
    expect(await screen.findByTestId("ordinary-drawmcp-canvas")).toBeInTheDocument();
  });

  it("treats the retired game query as the ordinary canvas", async () => {
    window.history.replaceState({}, "", "/canvas?demo=tic-tac-toe");
    render(<CanvasPage />);
    expect(await screen.findByTestId("ordinary-drawmcp-canvas")).toBeInTheDocument();
    expect(screen.queryByText(/tic-tac-toe/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /copy agent prompt/i })).not.toBeInTheDocument();
  });
});
