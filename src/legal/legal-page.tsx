import { BrandLogo } from "../components/ui/brand-logo";
import { MaterialIcon } from "../components/ui/material-icon";
import { LEGAL_ORDER, LEGAL_PAGES, LEGAL_UPDATED, type LegalSlug } from "./legal-content";
import "./legal.css";

/** One page for terms, privacy, cookies, contacts, data sources and accessibility. */
export function LegalPage({ slug }: { slug: LegalSlug }) {
  const page = LEGAL_PAGES[slug];
  return (
    <div className="legal-page">
      <header className="legal-header">
        <a href="/" className="legal-home" aria-label="На головну">
          <BrandLogo />
        </a>
        <a href="/app" className="legal-app-link">
          <MaterialIcon name="map" size={18} />
          Відкрити мапу
        </a>
      </header>
      <main className="legal-main" aria-labelledby="legal-title">
        <p className="legal-draft" role="note">
          <MaterialIcon name="info" size={18} />
          Чернетка від {LEGAL_UPDATED}. Текст ще не перевірив юрист; дані оператора буде додано.
        </p>
        <h1 id="legal-title">{page.title}</h1>
        <p className="legal-summary">{page.summary}</p>
        {page.sections.map((section) => (
          <section key={section.heading} className="legal-section">
            <h2>{section.heading}</h2>
            {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.items && (
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {section.links && (
              <ul className="legal-links">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} target="_blank" rel="noreferrer">
                      {link.label}
                      <MaterialIcon name="open_in_new" size={14} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </main>
      <LegalFooter current={slug} />
    </div>
  );
}

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
