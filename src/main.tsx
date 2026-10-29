import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

// A page file that fails to load (e.g. the browser cached a bad copy, or an
// old tab after a deploy) leaves the page blank. Re-download every script the
// page has fetched, bypassing the cache, then reload — at most once a minute,
// so a broken file can't loop but a later deploy can still recover.
const CHUNK_ERROR = /dynamically imported module|Importing a module script failed|error loading dynamically imported module/i;
const recoverFromChunkError = async (reason: unknown) => {
  if (!CHUNK_ERROR.test(String((reason as any)?.message ?? reason))) return;
  try {
    const last = Number(sessionStorage.getItem('turonmun:chunk-reload')) || 0;
    if (Date.now() - last < 60_000) return;
    sessionStorage.setItem('turonmun:chunk-reload', String(Date.now()));
  } catch { /* private mode: still try once */ }
  const scripts = performance.getEntriesByType('resource').map(r => r.name).filter(u => /\/assets\/[^?]+\.js/.test(u));
  await Promise.allSettled(scripts.map(u => fetch(u, { cache: 'reload' })));
  window.location.reload();
};
window.addEventListener('unhandledrejection', e => { recoverFromChunkError(e.reason); });
window.addEventListener('error', e => { recoverFromChunkError(e.error ?? e.message); });
window.addEventListener('vite:preloadError', e => { recoverFromChunkError((e as any).payload); });

createRoot(rootElement).render(<App />);

// Kill-switch: the service worker was retired (it caused 503s on subdomains);
// unregister any copy still installed in returning visitors' browsers.
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
    });
}
