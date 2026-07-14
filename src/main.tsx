import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import * as Sentry from "@sentry/react";
import { Analytics } from "@vercel/analytics/react";
import App from "./App.tsx";
import { initSentry } from "./lib/sentry";
import "./index.css";

initSentry();

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
