import overviewDoc from "../../design/README.md?raw";
import foundationsDoc from "../../design/foundations.md?raw";
import platformsDoc from "../../design/platforms.md?raw";
import navigationDoc from "../../design/navigation.md?raw";
import componentsDoc from "../../design/components.md?raw";
import screensDoc from "../../design/screens.md?raw";
import atomicDoc from "../../design/atomic.md?raw";
import { COMPONENT_CATEGORIES, COMPONENT_DOCS, type ComponentDoc } from "./component-docs";

export type PageId = string;

/** A page of the /design docs site: a markdown page from design/, a component page, or the live library. */
export type DocPage = {
  id: string;
  title: string;
  group: string;
  /** The builder page: composes blocks on the web. */
  builder?: boolean;
  /** File name inside design/, so links between docs can open the page. */
  file?: string;
  source?: string;
  component?: ComponentDoc;
};

const MARKDOWN_PAGES: DocPage[] = [
  { id: "overview", title: "Overview", group: "Start", file: "README.md", source: overviewDoc },
  { id: "live", title: "Live library", group: "Start" },
  { id: "foundations", title: "Foundations", group: "Rules", file: "foundations.md", source: foundationsDoc },
  { id: "platforms", title: "Web, iOS and Android", group: "Rules", file: "platforms.md", source: platformsDoc },
  { id: "navigation", title: "Navigation", group: "Rules", file: "navigation.md", source: navigationDoc },
  { id: "components", title: "Components overview", group: "Build", file: "components.md", source: componentsDoc },
  { id: "atomic", title: "Atomic design", group: "Rules", file: "atomic.md", source: atomicDoc },
  { id: "screens", title: "Screens and flows", group: "Build", file: "screens.md", source: screensDoc },
  { id: "builder", title: "Builder", group: "Build", builder: true },
];

const COMPONENT_PAGES: DocPage[] = COMPONENT_DOCS.map((component) => ({
  id: component.slug,
  title: component.title,
  group: "Components",
  component,
}));

export const DOC_PAGES: readonly DocPage[] = [...MARKDOWN_PAGES, ...COMPONENT_PAGES];

export const PAGE_IDS = DOC_PAGES.map((page) => page.id);

/** Sidebar groups in order. Each one can be opened and closed. */
export const DOC_GROUPS = ["Start", "Rules", "Build", "Components"].map((label) => ({
  label,
  // Component pages are listed under their categories, not directly under the group.
  pages: label === "Components" ? [] : DOC_PAGES.filter((page) => page.group === label),
  categories:
    label === "Components"
      ? COMPONENT_CATEGORIES.map((category) => ({
          label: category,
          pages: DOC_PAGES.filter((page) => page.component?.category === category),
        }))
      : [],
}));

export function findPage(id: string | null): DocPage {
  return DOC_PAGES.find((page) => page.id === id) ?? DOC_PAGES[0];
}
