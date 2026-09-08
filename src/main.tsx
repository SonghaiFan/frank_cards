import React from "react";
import ReactDOM from "react-dom/client";
import { isTauri } from "@tauri-apps/api/core";
import App from "./App";
import "./i18n";
import { AuthProvider } from "./auth/AuthProvider";
import { initializeAppTheme } from "./hooks/useAppTheme";
import ExternalSite from "./ExternalSite";

initializeAppTheme();

// WKWebView can report zero CSS safe-area insets even while rendering below
// the iOS status bar. Mark the native iOS runtime so CSS can apply a reliable
// Dynamic Island fallback without adding empty space to the regular website.
if (isTauri() && /iPhone|iPad|iPod/i.test(window.navigator.userAgent)) {
  document.documentElement.dataset.nativePlatform = "ios";
}

const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
const externalPage = pathname === "/support" || pathname === "/marketing" || pathname === "/privacy"
  ? pathname.slice(1) as "support" | "marketing" | "privacy"
  : null;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {externalPage ? (
      <ExternalSite page={externalPage} />
    ) : (
      <AuthProvider>
        <App />
      </AuthProvider>
    )}
  </React.StrictMode>
);
