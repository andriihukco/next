import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { AppErrorBoundary } from './components/app-error-boundary';
import { LandingPage } from './landing/landing-page';
import { isDevPathname } from './lib/dev-tools/route';
import './index.css';

// The map app and the design-system page pull in MapLibre and three.js, so the landing page does not load them.
const App = lazy(() => import('./App.tsx'));
const DesignSystemPage = lazy(() =>
  import('./design-system/design-system-page').then((module) => ({ default: module.DesignSystemPage })),
);

// Routes: `/` is the landing page, `/app` is the app (`/dev` keeps the developer
// tools on the app, see lib/dev-tools/route.ts), and `/design-system` is a
// developer reference page.
const path = window.location.pathname.replace(/\/+$/, '') || '/';
const isDesignSystem = path === '/design-system';
const isApp = path === '/app' || path.startsWith('/app/') || isDevPathname(path);

// The app shell locks html, body and #root to the viewport (overflow hidden).
// The landing page scrolls the document, so it lifts that lock on its own route.
if (!isDesignSystem && !isApp) {
  document.documentElement.classList.add('is-landing');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isDesignSystem ? (
      <Suspense fallback={null}>
        <DesignSystemPage />
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
