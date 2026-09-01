type SiteHeaderProps = {
  current?: "home" | "canvas" | "docs" | "benchmarks";
  compact?: boolean;
};

const links = [
  { href: "/#comparison", label: "Compare", id: "home" },
  { href: "/benchmarks", label: "Benchmarks", id: "benchmarks" },
  { href: "/docs", label: "Docs", id: "docs" },
] as const;

export const SiteHeader = ({ current, compact = false }: SiteHeaderProps) => (
  <header className={`site-header${compact ? " site-header-compact" : ""}`}>
    <a className="wordmark" href="/" aria-label="DrawMCP home">
      <span className="wordmark-mark" aria-hidden="true">
        D
      </span>
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
          {link.label}
        </a>
      ))}
      {current === "canvas" ? (
        <span className="canvas-live-label">
          <span className="live-dot" aria-hidden="true" />
          Live canvas
        </span>
      ) : (
        <a className="button button-small button-dark" href="/canvas">
          Open canvas
          <span aria-hidden="true">↗</span>
        </a>
      )}
    </nav>
  </header>
);
