import { lazy } from "react";

// Panels most visits never open load on demand (refactor-plan R9).
export const AdminPanel = lazy(() => import("./components/admin-panel").then((module) => ({ default: module.AdminPanel })));
export const CityLaunchDialog = lazy(() =>
  import("./components/city-launch-dialog").then((module) => ({ default: module.CityLaunchDialog })),
);
export const DevToolsLayer = lazy(() =>
  import("./components/dev-tools/dev-tools-layer").then((module) => ({ default: module.DevToolsLayer })),
);
export const NavigationPanel = lazy(() =>
  import("./components/navigation-panel").then((module) => ({ default: module.NavigationPanel })),
);
