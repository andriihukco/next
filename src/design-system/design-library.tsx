import { useEffect, useMemo, useState } from "react";
import { DOC_GROUPS, PAGE_IDS, findPage, type DocPage, type PageId } from "./design-docs";
import { DesignSystemPage } from "./design-system-page";
import { COMPONENT_HEADINGS, ComponentPage } from "./component-page";
import { DesignBuilder } from "./design-builder";
import { Markdown, pageHeadings, parseMarkdown, plainText } from "./design-markdown";
import { DeviceFrame, MOBILE_URL, PlatformSwitch, platformName, type Platform } from "./design-platform";

function readPage(): PageId {
  const value = new URLSearchParams(window.location.search).get("page");
  return PAGE_IDS.find((id) => id === value) ?? "overview";
}

function readPlatform(): Platform {
  const value = new URLSearchParams(window.location.search).get("platform");
  return value === "ios" || value === "android" ? value : "web";
}

/** Keeps the page and the platform in the URL, so a link opens the same view. */
function pageHref(page: PageId, platform: Platform) {
  const url = new URL(window.location.href);
  url.hash = "";
  if (page === "overview") url.searchParams.delete("page");
  else url.searchParams.set("page", page);
  const keepsPlatform = page === "live" || findPage(page).component !== undefined;
  if (keepsPlatform && platform !== "web") url.searchParams.set("platform", platform);
  else url.searchParams.delete("platform");
  return `${url.pathname}${url.search}`;
}

/**
 * /design: the next design library, as a documentation site. The sidebar lists every page; the
 * markdown pages render design/*.md in full width with an "On this page" list. The live library
 * shows each element as it ships: web components, and the iOS and Android kits (mobile/src/ui)
 * through the Expo app's /design screen, so both stay synced with the code.
 */
export function DesignLibrary() {
  const [page, setPage] = useState<PageId>(readPage);
  const [platform, setPlatform] = useState<Platform>(readPlatform);
  const [activeId, setActiveId] = useState<string | null>(null);

  const doc = findPage(page);
  const blocks = useMemo(() => (doc.source ? parseMarkdown(doc.source) : []), [doc.source]);
  const headings = useMemo(
    () =>
      doc.component
        ? COMPONENT_HEADINGS.filter((heading) => heading.id !== "rules" || doc.component?.rules)
        : pageHeadings(blocks),
    [doc.component, blocks],
  );

  useEffect(() => {
    const onPopState = () => {
      setPage(readPage());
      setPlatform(readPlatform());
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Highlight the "On this page" entry for the heading nearest the top of the reading area.
  useEffect(() => {
    setActiveId(headings[0]?.id ?? null);
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-80px 0px -70% 0px" },
    );
    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [headings]);

  const openPage = (next: PageId) => {
    if (next === page) return;
    setPage(next);
    window.history.pushState(null, "", pageHref(next, platform));
    window.scrollTo(0, 0);
  };

  const choosePlatform = (next: Platform) => {
    setPlatform(next);
    window.history.replaceState(null, "", pageHref(page, next));
  };

  return (
    <div className="ds-page ds-docs">
      <aside className="ds-sidebar">
        <p className="ds-eyebrow">next</p>
        <p className="ds-sidebar-title">Design</p>
        <nav aria-label="Design docs">
          {DOC_GROUPS.map((group) => (
            <details className="ds-sidebar-group" key={group.label} open>
              <summary className="ds-sidebar-label">{group.label}</summary>
              {group.pages.length > 0 && <SidebarLinks pages={group.pages} page={page} platform={platform} onOpen={openPage} />}
              {group.categories.map((category) => (
                <details className="ds-sidebar-category" key={category.label} open>
                  <summary className="ds-sidebar-category-label">{category.label}</summary>
                  <SidebarLinks pages={category.pages} page={page} platform={platform} onOpen={openPage} />
                </details>
              ))}
            </details>
          ))}
        </nav>
      </aside>

      <main className="ds-article">
        {doc.component ? (
          <ComponentPage doc={doc.component} platform={platform} onPlatform={choosePlatform} />
        ) : doc.builder ? (
          <article className="ds-article-body">
            <p className="ds-eyebrow">{doc.group}</p>
            <h1>Builder</h1>
            <p className="ds-lede">
              Compose atoms, molecules, organisms and a template into a screen. Copy the JSX when it looks right. The
              same blocks exist on mobile in mobile/src/ui; see Atomic design.
            </p>
            <DesignBuilder />
          </article>
        ) : doc.source ? (
          <article className="ds-article-body">
            <p className="ds-eyebrow">{doc.group}</p>
            <Markdown blocks={blocks} onOpenDoc={openPage} />
          </article>
        ) : (
          <article className="ds-article-body">
            <header className="ds-live-header">
              <p className="ds-eyebrow">{doc.group}</p>
              <h1>{doc.title}</h1>
              <p className="ds-lede">
                Each element as it ships. Pick a platform: web renders the web components, iOS and Android render the
                mobile kit through the Expo app. Tokens come from design/tokens.json.
              </p>
            </header>
            <div className="ds-live-switch">
              <PlatformSwitch value={platform} onChange={choosePlatform} />
            </div>

            {platform === "web" ? (
              <DesignSystemPage embedded />
            ) : MOBILE_URL ? (
              <DeviceFrame
                platform={platform}
                src={`${MOBILE_URL}/design?os=${platform}&embed=1`}
                title={`Mobile design library, ${platformName(platform)}`}
                note={`${platform === "ios" ? "Apple HIG: large titles, inset grouped lists, chevrons, rounded-rectangle buttons, light haptics." : "Material 3: top app bar, filled lists without chevrons, pill buttons, ripples, filter chips with a check."} Rendered live from mobile/src/ui.`}
              />
            ) : (
              <div className="ds-device-wrap">
                <p className="ds-device-note">
                  The mobile library is not hosted here yet. Run <code>npm run design:mobile</code> locally, or set
                  VITE_DESIGN_MOBILE_URL to a hosted export.
                </p>
              </div>
            )}
          </article>
        )}
      </main>

      {headings.length > 0 && (
        <aside className="ds-toc" aria-label="On this page">
          <p className="ds-toc-title">On this page</p>
          <ul>
            {headings.map((heading) => (
              <li key={heading.id} className={heading.level === 3 ? "ds-toc-sub" : undefined}>
                <a
                  href={`#${heading.id}`}
                  aria-current={activeId === heading.id ? "location" : undefined}
                >
                  {plainText(heading.text)}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}

function SidebarLinks({
  pages,
  page,
  platform,
  onOpen,
}: {
  pages: DocPage[];
  page: PageId;
  platform: Platform;
  onOpen: (id: PageId) => void;
}) {
  return (
    <ul className="ds-sidebar-list">
      {pages.map((item) => (
        <li key={item.id}>
          <a
            href={pageHref(item.id, platform)}
            className="ds-sidebar-link"
            aria-current={item.id === page ? "page" : undefined}
            onClick={(event) => {
              event.preventDefault();
              onOpen(item.id);
            }}
          >
            {item.title}
          </a>
        </li>
      ))}
    </ul>
  );
}
