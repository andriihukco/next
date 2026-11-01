import { type ReactNode } from "react";

/** Token lists and the section and specimen frames used by the /design-system page. */

export const COLOR_TOKENS = [
  "--background",
  "--foreground",
  "--card",
  "--surface-muted",
  "--muted-foreground",
  "--border",
  "--primary",
  "--primary-hover",
  "--primary-border",
  "--accent",
  "--accent-foreground",
  "--ring",
  "--destructive",
  "--scrim",
];

export const TYPE_TOKENS = [
  ["Caption", "--type-caption"],
  ["Small", "--type-small"],
  ["Body", "--type-body"],
  ["Title", "--type-title"],
  ["Inspector", "--type-inspector"],
  ["Display", "--type-display"],
] as const;

export const RADIUS_TOKENS = ["--radius-sm", "--radius-md", "--radius-pill"] as const;
export const SHADOW_TOKENS = ["--shadow-raised", "--shadow-overlay"] as const;

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="ds-section" id={id} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="ds-section-title">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ds-specimen">
      <span className="ds-specimen-label">{label}</span>
      <div className="ds-specimen-body">{children}</div>
    </div>
  );
}

export function TokenSwatches() {
  return (
    <div className="ds-swatches">
      {COLOR_TOKENS.map((token) => (
        <div className="ds-swatch" key={token}>
          <span className="ds-swatch-chip" style={{ background: `var(${token})` }} aria-hidden="true" />
          <code>{token}</code>
        </div>
      ))}
    </div>
  );
}
