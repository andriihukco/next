import overviewDoc from "../../design/README.md?raw";
import foundationsDoc from "../../design/foundations.md?raw";
import platformsDoc from "../../design/platforms.md?raw";
import navigationDoc from "../../design/navigation.md?raw";
import componentsDoc from "../../design/components.md?raw";
import screensDoc from "../../design/screens.md?raw";

/** The pages of the /design docs site. Markdown pages render design/*.md; "live" renders the components. */
export type PageId = "overview" | "live" | "foundations" | "platforms" | "navigation" | "components" | "screens";

export type DocPage = {
  id: PageId;
  title: string;
  group: string;
  /** File name inside design/, so links between docs can open the page. */
  file?: string;
  source?: string;
};

export const DOC_PAGES: readonly DocPage[] = [
  { id: "overview", title: "Overview", group: "Start", file: "README.md", source: overviewDoc },
  { id: "live", title: "Live library", group: "Start" },
  { id: "foundations", title: "Foundations", group: "Rules", file: "foundations.md", source: foundationsDoc },
  { id: "platforms", title: "Web, iOS and Android", group: "Rules", file: "platforms.md", source: platformsDoc },
  { id: "navigation", title: "Navigation", group: "Rules", file: "navigation.md", source: navigationDoc },
  { id: "components", title: "Components", group: "Build", file: "components.md", source: componentsDoc },
  { id: "screens", title: "Screens and flows", group: "Build", file: "screens.md", source: screensDoc },
];

export const PAGE_IDS = DOC_PAGES.map((page) => page.id);

export const DOC_GROUPS = [...new Set(DOC_PAGES.map((page) => page.group))].map((label) => ({
  label,
  pages: DOC_PAGES.filter((page) => page.group === label),
}));

export function findPage(id: string | null): DocPage {
  return DOC_PAGES.find((page) => page.id === id) ?? DOC_PAGES[0];
}
