import { LEGAL_ORDER, LEGAL_PAGES, type LegalSlug } from "./legal-content";
import "./legal.css";

/** Links to every legal page. Shared by the legal pages and the landing footer. */
export function LegalFooter({ current }: { current?: LegalSlug }) {
  return (
    <nav className="legal-footer" aria-label="Правова інформація">
      {LEGAL_ORDER.map((slug) => (
        <a key={slug} href={`/${slug}`} aria-current={slug === current ? "page" : undefined}>
          {LEGAL_PAGES[slug].title}
        </a>
      ))}
    </nav>
  );
}
