import { useSyncExternalStore } from "react";

const ALTERNATE_READER_SIDE_KEY = "frankcards-alternate-reader-side";
const PREFERENCE_CHANGE_EVENT = "frankcards:preference-change";
let alternateReaderSideFallback = true;

function getAlternateReaderSide(): boolean {
  try {
    const storedValue = localStorage.getItem(ALTERNATE_READER_SIDE_KEY);
    return storedValue === null ? alternateReaderSideFallback : storedValue === "true";
  } catch {
    return alternateReaderSideFallback;
  }
}

export function setAlternateReaderSide(enabled: boolean) {
  alternateReaderSideFallback = enabled;

  try {
    localStorage.setItem(ALTERNATE_READER_SIDE_KEY, String(enabled));
  } catch {}

  document.dispatchEvent(new Event(PREFERENCE_CHANGE_EVENT));
}

function subscribeToPreferences(onStoreChange: () => void) {
  document.addEventListener(PREFERENCE_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    document.removeEventListener(PREFERENCE_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function useAlternateReaderSide(): boolean {
  return useSyncExternalStore(
    subscribeToPreferences,
    getAlternateReaderSide,
    () => true,
  );
}
