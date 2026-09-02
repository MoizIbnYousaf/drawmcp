import { DrawablyBadge, DrawablyUnderline } from "drawably/react";
import { DrawMcpMark } from "./DrawMcpMark";
import { DrawablyLink } from "./DrawablyLink";

type SiteHeaderProps = {
  current?: "home" | "canvas" | "docs" | "benchmarks";
  compact?: boolean;
};

const links = [
  { href: "/#play", label: "Demo", id: "home" },
  { href: "/benchmarks", label: "Benchmarks", id: "benchmarks" },
  { href: "/docs", label: "Docs", id: "docs" },
] as const;

export const SiteHeader = ({ current, compact = false }: SiteHeaderProps) => (
  <header className={`site-header${compact ? " site-header-compact" : ""}`}>
    <a className="wordmark" href="/" aria-label="DrawMCP home">
      <DrawMcpMark />
      <span>DrawMCP</span>
    </a>
    <nav className="site-nav" aria-label="Primary navigation">
      {links.map((link) => (
        <a
          className={
            current === link.id ? "nav-link nav-link-active" : "nav-link"
          }
          aria-current={current === link.id ? "page" : undefined}
          href={link.href}
          key={link.href}
        >
          <DrawablyUnderline boil={0.18} roughness={0.65} stroke="#6c5ce7">
            {link.label}
          </DrawablyUnderline>
        </a>
      ))}
      {current === "canvas" ? (
        <DrawablyBadge
          className="canvas-live-label"
          fill="#dff5e4"
          roughness={0.7}
          stroke="#2f9e44"
          variant="outline"
        >
          <span className="live-dot" aria-hidden="true" />
          Live canvas
        </DrawablyBadge>
      ) : (
        <DrawablyLink className="button-small" href="/canvas" tone="dark">
          Open canvas
          <span aria-hidden="true">↗</span>
        </DrawablyLink>
      )}
    </nav>
  </header>
);
