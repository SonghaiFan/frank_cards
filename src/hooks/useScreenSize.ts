import { useSyncExternalStore } from "react";

interface ScreenSize {
  width: number;
  height: number;
  isMinimumSizeMet: boolean;
}

// Minimum screen size requirements
export const MIN_SCREEN_WIDTH = 300;
export const MIN_SCREEN_HEIGHT = 360;

const getViewportSnapshot = () => `${window.innerWidth}x${window.innerHeight}`;
const getServerSnapshot = () => "1024x768";

const subscribeToViewport = (onStoreChange: () => void) => {
  window.addEventListener("resize", onStoreChange);
  window.addEventListener("orientationchange", onStoreChange);
  window.visualViewport?.addEventListener("resize", onStoreChange);

  return () => {
    window.removeEventListener("resize", onStoreChange);
    window.removeEventListener("orientationchange", onStoreChange);
    window.visualViewport?.removeEventListener("resize", onStoreChange);
  };
};

export const useScreenSize = (): ScreenSize => {
  const snapshot = useSyncExternalStore(subscribeToViewport, getViewportSnapshot, getServerSnapshot);
  const [width, height] = snapshot.split("x").map(Number);

  return {
    width,
    height,
    isMinimumSizeMet: width >= MIN_SCREEN_WIDTH && height >= MIN_SCREEN_HEIGHT,
  };
};
