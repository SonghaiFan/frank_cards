import { useSyncExternalStore } from "react";

export type AppTheme = "light" | "dark";

const THEME_STORAGE_KEY = "frankcards-theme";
const THEME_CHANGE_EVENT = "frankcards:theme-change";

function getSystemTheme(): AppTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredTheme(): AppTheme | null {
  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === "light" || storedTheme === "dark" ? storedTheme : null;
  } catch {
    return null;
  }
}

export function getAppTheme(): AppTheme {
  const theme = document.documentElement.dataset.theme;
  return theme === "light" || theme === "dark" ? theme : getSystemTheme();
}

export function initializeAppTheme(): AppTheme {
  const theme = getStoredTheme() ?? getSystemTheme();
  document.documentElement.dataset.theme = theme;
  return theme;
}

export function setAppTheme(theme: AppTheme) {
  document.documentElement.dataset.theme = theme;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The theme still applies for this visit when storage is unavailable.
  }

  document.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

function subscribeToTheme(onStoreChange: () => void) {
  document.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  return () => document.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
}

export function useAppTheme(): AppTheme {
  return useSyncExternalStore(
    subscribeToTheme,
    getAppTheme,
    () => "light",
  );
}
