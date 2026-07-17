import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import * as Sentry from "@sentry/react";
import { Analytics } from "@vercel/analytics/react";
import App from "./App.tsx";
import { initSentry } from "./lib/sentry";
// Self-hosted fonts (previously loaded via a render-blocking @import to
// fonts.googleapis.com — Google domains are unreliably reachable from
// mainland China, one of this app's core markets).
import "@fontsource/cormorant-garamond/300.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/700.css";
import "@fontsource/cormorant-garamond/300-italic.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "./index.css";

initSentry();

// A stale tab can try to fetch a chunk that a newer deploy has already removed
// (hashed filename no longer exists) — Vite dispatches this event when that
// dynamic import fails. Reload once to pick up the current build; the
// sessionStorage guard stops a reload loop if the fetch keeps failing.
// preventDefault() is required: without it Vite rethrows the original error
// after this listener runs, so it still reaches Sentry as an unhandled error
// even though the reload already recovers the page.
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  const key = "vite-preload-error-reloaded";
  if (!sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, "1");
    window.location.reload();
  }
});

const errorFallback = (
  <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
    <div>
      <h1>Something went wrong</h1>
      <p>Please refresh the page. If this keeps happening, contact info@pacificalpacas.nz.</p>
    </div>
  </div>
);

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary fallback={errorFallback}>
    <HelmetProvider>
      <App />
      <Analytics />
    </HelmetProvider>
  </Sentry.ErrorBoundary>
);
