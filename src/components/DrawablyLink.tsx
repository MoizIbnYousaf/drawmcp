import { DrawablyCard } from "drawably/react";
import type { ReactNode } from "react";

type DrawablyLinkProps = {
  children: ReactNode;
  className?: string;
  href: string;
  tone?: "dark" | "paper" | "green";
};

const tones = {
  dark: { stroke: "#1c1c19", fill: "#1c1c19", paper: "#fffefa" },
  paper: { stroke: "#79766d", fill: "#f7f6f1", paper: "#fffefa" },
  green: { stroke: "#2f9e44", fill: "#dff5e4", paper: "#fffefa" },
} as const;

export const DrawablyLink = ({
  children,
  className = "",
  href,
  tone = "paper",
}: DrawablyLinkProps) => {
  const palette = tones[tone];
  return (
    <DrawablyCard
      boil={0.22}
      className={`drawably-link-card drawably-link-card-${tone} ${className}`}
      fill={palette.fill}
      paper={palette.paper}
      roughness={0.75}
      stroke={palette.stroke}
      width={1.6}
    >
      <a href={href}>{children}</a>
    </DrawablyCard>
  );
};
