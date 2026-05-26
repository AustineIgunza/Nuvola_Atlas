/**
 * Standalone SPA entry point for Vercel deployment.
 * Uses the same pages/components as the Inertia app,
 * but with client-side routing (no Laravel backend needed).
 */
import '../css/app.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { createRoot } from 'react-dom/client';
import { useState, useEffect, lazy, Suspense } from 'react';
import AppLayout from './layouts/AppLayout';

// Lazy-load pages for code splitting
const Atlas = lazy(() => import('./pages/Atlas'));
const Vitality = lazy(() => import('./pages/Vitality'));
const Infrastructure = lazy(() => import('./pages/Infrastructure'));
const Reports = lazy(() => import('./pages/Reports'));
const Alerts = lazy(() => import('./pages/Alerts'));
const SignIn = lazy(() => import('./pages/SignIn'));
const SignUp = lazy(() => import('./pages/SignUp'));

function getPage(path: string) {
  if (path === '/' || path.startsWith('/atlas')) return Atlas;
  if (path.startsWith('/vitality')) return Vitality;
  if (path.startsWith('/infrastructure')) return Infrastructure;
  if (path.startsWith('/reports')) return Reports;
  if (path.startsWith('/alerts')) return Alerts;
  if (path.startsWith('/sign-in')) return SignIn;
  if (path.startsWith('/sign-up')) return SignUp;
  return Atlas; // fallback
}

function SpaRouter() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Intercept all internal link clicks for SPA navigation
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#')) return;
      if (anchor.getAttribute('target') === '_blank') return;
      e.preventDefault();
      window.history.pushState({}, '', href);
      setPath(href);
      window.scrollTo(0, 0);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const PageComponent = getPage(path);

  return (
    <AppLayout>
      <Suspense fallback={<div className="flex items-center justify-center h-64 text-ink/30 text-sm">Loading...</div>}>
        <PageComponent />
      </Suspense>
    </AppLayout>
  );
}

const root = document.getElementById('app');
if (root) {
  createRoot(root).render(<SpaRouter />);
}
