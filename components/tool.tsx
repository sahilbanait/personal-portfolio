import type { CSSProperties } from "react";
import { icons } from "@/data/icons";
import { iconId } from "@/lib/art";

// A tool's logo from the page's SVG sprite, or a dot when there's no logo for it.
export function ToolIcon({ name }: { name: string }) {
  return icons[name] ? (
    <svg className="ic" aria-hidden="true">
      <use href={`#${iconId(name)}`} />
    </svg>
  ) : (
    <span className="dot-ic" aria-hidden="true" />
  );
}

export const Tool = ({
  name,
  ...rest
}: {
  name: string;
  className?: string;
  style?: CSSProperties;
}) => (
  <li {...rest}>
    <ToolIcon name={name} />
    {name}
  </li>
);
