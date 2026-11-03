import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { AppErrorBoundary } from './components/app-error-boundary';
import { LandingPage } from './landing/landing-page';
import { CityLandingPage } from './landing/city-landing-page';
import { findCity } from './landing/landing-cities';
import { isDevPathname } from './lib/dev-tools/route';
import { isLegalSlug } from './legal/legal-content';
import './index.css';
import './lib/appearance.css';
import './lib/appearance';

// The map app and the design-system page pull in MapLibre and three.js, so the landing page does not load them.
const App = lazy(() => import('./App.tsx'));
const AdminApp = lazy(() => import('./admin/admin-app').then((module) => ({ default: module.AdminApp })));
const UpdatesPage = lazy(() => import('./updates/updates-page').then((module) => ({ default: module.UpdatesPage })));
const LegalPage = lazy(() => import('./legal/legal-page').then((module) => ({ default: module.LegalPage })));
const DesignLibrary = lazy(() =>
  import('./design-system/design-library').then((module) => ({ default: module.DesignLibrary })),
);

// Routes: `/` is the landing page, `/app` is the app (`/dev` keeps the developer
// tools on the app, see lib/dev-tools/route.ts), and `/design` (alias `/design-system`) is the
// design library for web, iOS and Android. `/terms`, `/privacy`, `/cookies`, `/contacts`, `/sources`
// and `/accessibility` are the legal and trust pages (platform-plan S8); `/updates` is «Що нового» (S7); `/admin` is the role-gated admin (S2).
const path = window.location.pathname.replace(/\/+$/, '') || '/';
const isDesignSystem = path === '/design' || path === '/design-system';
const isApp = path === '/app' || path.startsWith('/app/') || isDevPathname(path);
const legalSlug = path.slice(1);
// `/<city>` is the city page (landing/landing-cities.ts). Unknown paths keep the global landing.
const city = findCity(legalSlug);

// The app shell locks html, body and #root to the viewport (overflow hidden).
// The landing page scrolls the document, so it lifts that lock on its own route.
if (!isDesignSystem && !isApp) {
  document.documentElement.classList.add('is-landing');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {path === '/admin' ? (
      <Suspense fallback={null}>
        <AdminApp />
      </Suspense>
    ) : path === '/updates' ? (
      <Suspense fallback={null}>
        <UpdatesPage />
      </Suspense>
    ) : isLegalSlug(legalSlug) ? (
      <Suspense fallback={null}>
        <LegalPage slug={legalSlug} />
      </Suspense>
    ) : city ? (
      <CityLandingPage city={city} />
    ) : isDesignSystem ? (
      <Suspense fallback={null}>
        <DesignLibrary />
      </Suspense>
    ) : isApp ? (
      <AppErrorBoundary>
        <Suspense fallback={null}>
          <App />
        </Suspense>
      </AppErrorBoundary>
    ) : (
      <LandingPage />
    )}
  </React.StrictMode>
);
