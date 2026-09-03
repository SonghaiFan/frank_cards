import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { ConversationGame } from "../types/ConversationGame";
import CardPack from "./CardPack";
import { useTranslation } from "react-i18next";
import GameInfoPanel from "./GameInfoPanel";
import GameIntroPanel from "./GameIntroPanel";
import KneeConversationIllustration from "./KneeConversationIllustration";
import { useEasterEgg } from "../hooks/useEasterEgg";
import { LIBRARY_DESKTOP_QUERY, useMediaQuery } from "../hooks/useMediaQuery";


interface QuickGameLibraryProps {
  games: ConversationGame[];
  isCustomMode?: boolean;
  isLoading?: boolean;
  onStartGame: (game: ConversationGame) => void;
  onSwitchToCustom: () => void;
}

interface PullGesture {
  lastDistance: number;
  maxDistance: number;
  startY: number;
}

const PULL_ACTION_THRESHOLD = 72;
const MAX_PULL_DISTANCE = 112;

const createCompanionColor = (color?: string) => {
  if (!color) return undefined;
  const normalized = color.replace("#", "");
  const expanded = normalized.length === 3
    ? normalized.split("").map((character) => character + character).join("")
    : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return color;

  const channels = [0, 2, 4].map((offset) => parseInt(expanded.slice(offset, offset + 2), 16));
  const luminance = (0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]) / 255;
  const target = luminance < 0.42 ? 255 : 13;
  const amount = luminance < 0.42 ? 0.28 : 0.2;
  const mixed = channels.map((channel) => Math.round(channel + (target - channel) * amount));

  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
};

const createThemeMeshPalette = (colors: string[]) => {
  const palette = colors.filter(Boolean);
  const fallback = ["#89c7dc", "#707fc2", "#ff707a", "#ff9c48", "#ef7fba"];

  if (palette.length === 0) return fallback;

  return Array.from({ length: 5 }, (_, index) => palette[index % palette.length]);
};

const panelVariants = {
  enter: (direction: number) => ({
    y: direction > 0 ? 50 : -50,
    opacity: 0,
  }),
  center: {
    y: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    y: direction > 0 ? -50 : 50,
    opacity: 0,
  }),
};

const deceleratingEase = [0.16, 1, 0.3, 1] as const;

interface MobilePackProgressProps {
  activeIndex: number;
  games: ConversationGame[];
  label: string;
  onScrubProgress: (progress: number) => void;
  onScrubEnd: () => void;
  onScrubStart: () => void;
  onSelectIndex: (index: number) => void;
  uiColor: string;
}

const MobilePackProgress = memo(function MobilePackProgress({
  activeIndex,
  games,
  label,
  onScrubProgress,
  onScrubEnd,
  onScrubStart,
  onSelectIndex,
  uiColor,
}: MobilePackProgressProps) {
  const activePointerRef = useRef<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const scrubFromPointerPosition = useCallback((clientY: number) => {
    const track = trackRef.current;
    const firstSlot = track?.firstElementChild as HTMLElement | null;
    const lastSlot = track?.lastElementChild as HTMLElement | null;
    if (!track || !firstSlot || !lastSlot || games.length === 0) return;

    const firstRect = firstSlot.getBoundingClientRect();
    const lastRect = lastSlot.getBoundingClientRect();
    const start = firstRect.top + firstRect.height / 2;
    const end = lastRect.top + lastRect.height / 2;
    const progress = end === start ? 0 : Math.max(0, Math.min(1, (clientY - start) / (end - start)));
    onScrubProgress(progress);
  }, [games.length, onScrubProgress]);

  return (
    <div
      aria-label={label}
      aria-orientation="vertical"
      aria-valuemax={games.length}
      aria-valuemin={1}
      aria-valuenow={activeIndex + 1}
      className="absolute left-0 top-1/2 z-40 -translate-y-1/2 cursor-ns-resize touch-none px-3 py-4 outline-none focus-visible:rounded-full"
      data-mobile-pack-progress
      onKeyDown={(event) => {
        if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
        event.preventDefault();
        const offset = event.key === "ArrowUp" ? -1 : 1;
        onSelectIndex(Math.max(0, Math.min(games.length - 1, activeIndex + offset)));
      }}
      onLostPointerCapture={(event) => {
        if (activePointerRef.current !== event.pointerId) return;
        activePointerRef.current = null;
        onScrubEnd();
      }}
      onPointerCancel={(event) => {
        if (activePointerRef.current !== event.pointerId) return;
        activePointerRef.current = null;
        onScrubEnd();
      }}
      onPointerDown={(event) => {
        if (!event.isPrimary) return;
        activePointerRef.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.focus({ preventScroll: true });
        onScrubStart();
        scrubFromPointerPosition(event.clientY);
      }}
      onPointerMove={(event) => {
        if (activePointerRef.current !== event.pointerId) return;
        scrubFromPointerPosition(event.clientY);
      }}
      onPointerUp={(event) => {
        if (activePointerRef.current !== event.pointerId) return;
        activePointerRef.current = null;
        event.currentTarget.releasePointerCapture(event.pointerId);
        onScrubEnd();
      }}
      role="slider"
      style={{ color: uiColor }}
      tabIndex={0}
    >
      <div ref={trackRef} aria-hidden="true" className="flex flex-col items-center gap-1">
        {games.map((game, index) => {
          const isActive = index === activeIndex;

          return (
            <span key={game.testID} className="flex h-2 w-2 items-center justify-center">
              <span
                className={`h-1 w-1 transform-gpu rounded-full bg-current transition-[transform,opacity] duration-200 motion-reduce:transition-none ${
                  isActive ? "scale-[2] opacity-100" : "scale-100 opacity-30"
                }`}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
});

interface ThemeColorBlurLayerProps {
  isActive: boolean;
  palette: string[];
  reducedMotion: boolean | null;
  skipInitialAnimation?: boolean;
}

const ThemeColorBlurLayer = memo(function ThemeColorBlurLayer({
  isActive,
  palette,
  reducedMotion,
  skipInitialAnimation = false,
}: ThemeColorBlurLayerProps) {
  return (
    <motion.div
      aria-hidden="true"
      initial={reducedMotion || skipInitialAnimation ? false : { opacity: 0 }}
      animate={{ opacity: isActive ? 1 : 0 }}
      transition={{ duration: reducedMotion ? 0 : 1.15, ease: "easeInOut" }}
      className="theme-color-blur-background pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{
        "--theme-mesh-1": palette[0],
        "--theme-mesh-2": palette[1],
        "--theme-mesh-3": palette[2],
        "--theme-mesh-4": palette[3],
        "--theme-mesh-5": palette[4],
      } as React.CSSProperties}
    >
      <div className="theme-color-blur-mesh">
        <div className="theme-color-blur-field theme-color-blur-field-primary" />
        <div className="theme-color-blur-field theme-color-blur-field-secondary" />
      </div>
    </motion.div>
  );
});

interface ThemeColorBlurBackgroundProps {
  gameId: string;
  palette: string[];
  reducedMotion: boolean | null;
}

interface ThemeLayerState {
  gameId: string;
  palette: string[];
  skipInitialAnimation?: boolean;
}

const ThemeColorBlurBackground = memo(function ThemeColorBlurBackground({
  gameId,
  palette,
  reducedMotion,
}: ThemeColorBlurBackgroundProps) {
  const paletteKey = palette.join("|");
  const stablePalette = useMemo(() => palette, [paletteKey]);
  const [layers, setLayers] = useState<ThemeLayerState[]>(() => ([{
    gameId,
    palette: stablePalette,
    skipInitialAnimation: true,
  }]));

  useEffect(() => {
    if (reducedMotion) {
      setLayers([{ gameId, palette: stablePalette, skipInitialAnimation: true }]);
      return;
    }

    setLayers((currentLayers) => {
      const activeLayer = currentLayers[currentLayers.length - 1];
      if (activeLayer.gameId === gameId && activeLayer.palette.join("|") === paletteKey) {
        return currentLayers;
      }

      return [activeLayer, { gameId, palette: stablePalette }];
    });

    const removalTimer = window.setTimeout(() => {
      setLayers((currentLayers) => currentLayers.slice(-1));
    }, 1200);

    return () => window.clearTimeout(removalTimer);
  }, [gameId, paletteKey, reducedMotion, stablePalette]);

  return (
    <>
      {layers.map((layer, index) => (
        <ThemeColorBlurLayer
          key={`${layer.gameId}-${layer.palette.join("|")}`}
          isActive={index === layers.length - 1}
          palette={layer.palette}
          reducedMotion={reducedMotion}
          skipInitialAnimation={layer.skipInitialAnimation}
        />
      ))}
    </>
  );
});

interface CardWheelProps {
  allItems: ConversationGame[];
  containerRef: React.RefObject<HTMLDivElement>;
  focusedGameId: string;
  initialOffset: number;
  isLaunching: boolean;
  itemHeight: number;
  maxAngle: number;
  onStartGame: (game: ConversationGame) => void;
  radius: number;
  reducedMotion: boolean | null;
  visibleRange: number;
}

const CardWheel = memo(function CardWheel({
  allItems,
  containerRef,
  focusedGameId,
  initialOffset,
  isLaunching,
  itemHeight,
  maxAngle,
  onStartGame,
  radius,
  reducedMotion,
  visibleRange,
}: CardWheelProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const [isEntranceVisible, setIsEntranceVisible] = useState(Boolean(reducedMotion));
  const [hasCompletedEntrance, setHasCompletedEntrance] = useState(Boolean(reducedMotion));

  useEffect(() => {
    if (reducedMotion) {
      setIsEntranceVisible(true);
      setHasCompletedEntrance(true);
      return;
    }

    const entranceFrame = window.requestAnimationFrame(() => setIsEntranceVisible(true));
    const entranceTimer = window.setTimeout(() => setHasCompletedEntrance(true), 1100);
    return () => {
      window.cancelAnimationFrame(entranceFrame);
      window.clearTimeout(entranceTimer);
    };
  }, [reducedMotion]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frame: number | null = null;
    const updateScrollPosition = () => {
      frame = null;
      setScrollTop(container.scrollTop);
    };
    const handleScroll = () => {
      if (frame === null) frame = window.requestAnimationFrame(updateScrollPosition);
    };

    updateScrollPosition();
    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [containerRef]);

  const viewportCenter = (containerRef.current?.clientHeight || window.innerHeight) / 2;
  const focusedItemIndex = allItems.findIndex((game) => game.testID === focusedGameId);

  return (
    <motion.div
      data-layer="card-wheel"
      animate={{ x: isLaunching ? "-115vw" : 0 }}
      transition={{
        duration: reducedMotion ? 0 : 0.72,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="absolute top-0 left-0 bottom-0 w-[400px] xl:w-[500px] pointer-events-none z-20 flex items-center overflow-visible will-change-transform"
    >
      <div className="relative w-full h-full">
        {allItems.map((game, index) => {
          const itemY = index * itemHeight + (itemHeight / 2) + initialOffset;
          const dist = itemY - (scrollTop + viewportCenter);
          const relativePos = dist / 600;

          if (Math.abs(relativePos) > visibleRange) return null;

          const angleDeg = relativePos * maxAngle;
          const angleRad = (angleDeg * Math.PI) / 180;
          const translateX = (Math.cos(angleRad) * radius) - radius + 50;
          const arcY = Math.sin(angleRad) * radius;
          const scale = Math.max(0, 1 - Math.abs(relativePos) * 0.4);
          const opacity = Math.max(0, 1 - Math.abs(relativePos) * 0.6);
          const isPlaceholder = game.testID === "intro-card" || game.testID === "end-card";
          const distanceFromFocus = Math.abs(index - Math.max(0, focusedItemIndex));
          const entranceRotation = index <= focusedItemIndex ? -2.4 : 2.4;

          return (
            <div
              key={game.testID}
              className="absolute left-4 top-1/2 w-full flex justify-center pointer-events-auto transition-transform duration-75 ease-out"
              style={{
                marginTop: "-125px",
                transform: `translateY(${arcY}px) translateX(${translateX}px) rotateZ(${angleDeg}deg) scale(${scale})`,
                opacity,
                zIndex: Math.round(100 - Math.abs(relativePos) * 100),
              }}
            >
              <motion.div
                data-card-entrance
                initial={false}
                animate={isEntranceVisible || hasCompletedEntrance
                  ? { opacity: 1, rotate: 0, scale: 1, y: 0 }
                  : {
                      opacity: 0,
                      rotate: entranceRotation,
                      scale: 0.975,
                      y: 16,
                    }}
                transition={{
                  duration: reducedMotion ? 0 : 0.82,
                  delay: reducedMotion || hasCompletedEntrance ? 0 : 0.08 + Math.min(distanceFromFocus, 3) * 0.055,
                  ease: deceleratingEase,
                }}
                style={{ transformOrigin: "50% 58%" }}
              >
                <CardPack
                  game={game}
                  index={index}
                  isSelected={focusedGameId === game.testID}
                  isHovered={false}
                  onToggle={() => onStartGame(game)}
                  onHoverStart={() => {}}
                  onHoverEnd={() => {}}
                  minimal={isPlaceholder}
                  disableEntranceAnimation={true}
                  style={{ width: "400px", height: "250px" }}
                  className="relative cursor-pointer group shadow-2xl rounded-3xl"
                />
              </motion.div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
});

const QuickGameLibrary: React.FC<QuickGameLibraryProps> = ({
  games,
  isCustomMode = false,
  isLoading = false,
  onStartGame,
  onSwitchToCustom,
}) => {
  const reducedMotion = useReducedMotion();
  const [focusedGameId, setFocusedGameId] = useState<string>(games[0]?.testID || "");
  const [direction, setDirection] = useState(1); // 1 = down/next, -1 = up/prev
  const [isLaunching, setIsLaunching] = useState(false);
  const [isPackScrubbing, setIsPackScrubbing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const launchFrameRef = useRef<number | null>(null);
  const pendingGameRef = useRef<ConversationGame | null>(null);
  const lastIndexRef = useRef(0);
  const libraryScrollProgress = useMotionValue(0);
  const pullRotation = useMotionValue(0);
  const pullGestureRef = useRef<PullGesture | null>(null);
  const pullReleaseAnimationRef = useRef<ReturnType<typeof animate> | null>(null);
  const scrubSnapTimerRef = useRef<number | null>(null);
  const notifyContourLayout = useCallback(() => {
    document.dispatchEvent(new Event("frankcards:figure-layout"));
  }, []);

  const { t } = useTranslation();
  const [showUnlockMessage, setShowUnlockMessage] = useState(false);

  // Easter egg hook for premium unlock
  const { handleClick, isUnlocked } = useEasterEgg({
    clickCount: 4,
    timeWindow: 2000,
    onUnlock: () => {
      setShowUnlockMessage(true);
      setTimeout(() => setShowUnlockMessage(false), 3000);
    },
  });

  // Constants for geometry
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const isDesktopLayout = useMediaQuery(LIBRARY_DESKTOP_QUERY);
  const isWideDesktop = useMediaQuery("(min-width: 80rem)");

  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = !isDesktopLayout;

  // Constants for geometry
  const ITEM_HEIGHT = isMobile ? 180 : isWideDesktop ? 200 : 190;
  const RADIUS = isMobile ? 500 : isWideDesktop ? 800 : 620;
  const MAX_ANGLE = 60;
  const VISIBLE_RANGE = isMobile ? 1.5 : isWideDesktop ? 2 : 1.75;

  const introGame = useMemo<ConversationGame>(() => ({
    testID: "intro-card",
    app: { title: t("quickMode.title"), subtitle: t("quickMode.cta"), language: "", type: "normal", playerGroup: [] },
    ui: { startScreen: { title: "", description: [], startButton: "" }, endScreen: { title: "", subtitle: "", restartButton: "" } },
    theme: { categories: {} },
    questions: [],
  }), [t]);

  const endGame = useMemo<ConversationGame>(() => ({
    testID: "end-card",
    app: { title: t("quickMode.cta2"), subtitle: "", language: "", type: "normal", playerGroup: [] },
    ui: { startScreen: { title: "", description: [], startButton: "" }, endScreen: { title: "", subtitle: "", restartButton: "" } },
    theme: { categories: {} },
    questions: [],
  }), [t]);

  const filteredGames = useMemo(
    () => games.filter((game) => game.app.type !== "premium" || isUnlocked),
    [games, isUnlocked],
  );
  const allItems = useMemo(
    () => [introGame, ...filteredGames, endGame],
    [endGame, filteredGames, introGame],
  );

  // Dynamic calculations
  const INITIAL_OFFSET = viewportHeight / 2 - ITEM_HEIGHT / 2;
  const TOTAL_HEIGHT = allItems.length * ITEM_HEIGHT + viewportHeight;

  // Scroll Handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frame: number | null = null;
    const updateFocusedGame = () => {
      frame = null;
      libraryScrollProgress.set(Math.max(0, container.scrollTop / ITEM_HEIGHT));
      const index = Math.round(container.scrollTop / ITEM_HEIGHT);

      if (index !== lastIndexRef.current) {
        setDirection(index > lastIndexRef.current ? 1 : -1);
        lastIndexRef.current = index;
      }

      const safeIndex = Math.max(0, Math.min(allItems.length - 1, index));
      const game = allItems[safeIndex];
      if (game) setFocusedGameId((currentId) => currentId === game.testID ? currentId : game.testID);
    };
    const handleScroll = () => {
      if (frame === null) frame = window.requestAnimationFrame(updateFocusedGame);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    updateFocusedGame();

    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [allItems, ITEM_HEIGHT, libraryScrollProgress]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || reducedMotion || !isMobile || isLoading) return;

    const finishPull = () => {
      const gesture = pullGestureRef.current;
      pullGestureRef.current = null;
      delete container.dataset.pullArmed;
      if (!gesture || gesture.maxDistance < 4) return;

      const currentRotation = pullRotation.get();
      const releaseVelocity = Math.max(360, Math.abs(pullRotation.getVelocity()));
      const momentumDegrees = Math.min(1080, Math.max(360, releaseVelocity * 0.48));
      const targetRotation = Math.ceil((currentRotation + momentumDegrees) / 360) * 360;
      const duration = Math.min(2.25, Math.max(1.15, (targetRotation - currentRotation) / releaseVelocity * 1.35));

      pullReleaseAnimationRef.current?.stop();
      pullReleaseAnimationRef.current = animate(pullRotation, targetRotation, {
        duration,
        ease: [0.08, 0.72, 0.16, 1],
      });

      if (gesture.maxDistance >= PULL_ACTION_THRESHOLD) {
        document.dispatchEvent(new CustomEvent("frankcards:pull-to-action", {
          detail: { distance: gesture.maxDistance },
        }));
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1 || container.scrollTop > 0) return;
      pullReleaseAnimationRef.current?.stop();
      const startY = event.touches[0].clientY;
      pullGestureRef.current = { lastDistance: 0, maxDistance: 0, startY };
    };

    const handleTrackedTouchMove = (event: TouchEvent) => {
      const gesture = pullGestureRef.current;
      if (!gesture || event.touches.length !== 1 || container.scrollTop > 0) return;
      const rawDistance = Math.max(0, event.touches[0].clientY - gesture.startY);
      const resistedDistance = Math.min(MAX_PULL_DISTANCE, rawDistance * 0.58);
      const delta = resistedDistance - gesture.lastDistance;
      gesture.lastDistance = resistedDistance;
      gesture.maxDistance = Math.max(gesture.maxDistance, resistedDistance);
      pullRotation.set(pullRotation.get() + delta * 3.2);
      container.dataset.pullArmed = resistedDistance >= PULL_ACTION_THRESHOLD ? "true" : "false";
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTrackedTouchMove, { passive: true });
    container.addEventListener("touchend", finishPull, { passive: true });
    container.addEventListener("touchcancel", finishPull, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTrackedTouchMove);
      container.removeEventListener("touchend", finishPull);
      container.removeEventListener("touchcancel", finishPull);
      pullReleaseAnimationRef.current?.stop();
      pullGestureRef.current = null;
      delete container.dataset.pullArmed;
    };
  }, [isLoading, isMobile, pullRotation, reducedMotion]);

  const focusedGame = allItems.find((g) => g.testID === focusedGameId) || allItems[0];
  const focusedPackIndex = filteredGames.findIndex((game) => game.testID === focusedGameId);
  const handleMobilePackScrubStart = useCallback(() => {
    const container = containerRef.current;
    if (scrubSnapTimerRef.current !== null) {
      window.clearTimeout(scrubSnapTimerRef.current);
      scrubSnapTimerRef.current = null;
    }
    if (container) {
      container.style.scrollBehavior = "auto";
      container.style.scrollSnapType = "none";
    }
    setIsPackScrubbing(true);
  }, []);

  const handleMobilePackScrubProgress = useCallback((progress: number) => {
    const container = containerRef.current;
    if (!container || filteredGames.length === 0) return;

    const continuousPackIndex = progress * Math.max(0, filteredGames.length - 1);
    const continuousItemPosition = continuousPackIndex + 1;
    libraryScrollProgress.set(continuousItemPosition);
    container.scrollTop = continuousItemPosition * ITEM_HEIGHT;
  }, [filteredGames.length, ITEM_HEIGHT, libraryScrollProgress]);

  const handleMobilePackScrubEnd = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      const nearestItemIndex = Math.max(
        1,
        Math.min(filteredGames.length, Math.round(container.scrollTop / ITEM_HEIGHT)),
      );
      const behavior = reducedMotion ? "auto" : "smooth";

      container.style.scrollBehavior = behavior;
      container.scrollTo({
        top: nearestItemIndex * ITEM_HEIGHT,
        behavior,
      });

      scrubSnapTimerRef.current = window.setTimeout(() => {
        container.style.scrollSnapType = "";
        scrubSnapTimerRef.current = null;
      }, reducedMotion ? 0 : 420);
    }
    setIsPackScrubbing(false);
  }, [filteredGames.length, ITEM_HEIGHT, reducedMotion]);
  const handleMobilePackSelect = useCallback((packIndex: number) => {
    const container = containerRef.current;
    const game = filteredGames[packIndex];
    if (!container || !game) return;

    const itemIndex = packIndex + 1;
    if (itemIndex !== lastIndexRef.current) {
      setDirection(itemIndex > lastIndexRef.current ? 1 : -1);
      lastIndexRef.current = itemIndex;
    }
    setFocusedGameId((currentId) => currentId === game.testID ? currentId : game.testID);
    container.scrollTop = itemIndex * ITEM_HEIGHT;
  }, [filteredGames, ITEM_HEIGHT]);
  const focusedThemeColors = Object.values(focusedGame.theme.categories).map((category) => category.color);
  const femaleThemeColor = focusedThemeColors[0];
  const maleThemeColor = focusedThemeColors[1] || createCompanionColor(femaleThemeColor);
  const backgroundThemeColors = focusedThemeColors.length > 1
    ? focusedThemeColors
    : [femaleThemeColor || "#9ca283", maleThemeColor || "#9ab1cc"];
  const themeMeshPalette = createThemeMeshPalette(backgroundThemeColors);
  // The library backdrop is a translucent mesh blended into the theme canvas,
  // not a solid category color. Its readable foreground should therefore follow
  // the final light/dark canvas token instead of any individual palette entry.
  const panelUiColor = "var(--material-ink)";

  const handleStartGame = useCallback((game: ConversationGame) => {
    if (
      isLaunching ||
      pendingGameRef.current ||
      game.testID === "intro-card" ||
      game.testID === "end-card"
    ) return;

    if (reducedMotion) {
      onStartGame(game);
      return;
    }

    pendingGameRef.current = game;
    setIsLaunching(true);

    // Commit the destination on the next painted frame. AnimatePresence keeps
    // this library mounted as the source scene, so both sides share one handoff
    // instead of leaving an empty interval between two separate animations.
    launchFrameRef.current = window.requestAnimationFrame(() => {
      launchFrameRef.current = null;
      const pendingGame = pendingGameRef.current;
      pendingGameRef.current = null;
      if (pendingGame) onStartGame(pendingGame);
    });
  }, [isLaunching, onStartGame, reducedMotion]);

  useEffect(() => () => {
    if (launchFrameRef.current !== null) {
      window.cancelAnimationFrame(launchFrameRef.current);
    }
    if (scrubSnapTimerRef.current !== null) {
      window.clearTimeout(scrubSnapTimerRef.current);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`theme-canvas relative w-full h-full ${isLaunching || isLoading ? 'overflow-hidden' : 'overflow-y-auto'} overflow-x-hidden no-scrollbar scroll-smooth ${isMobile && !isLoading ? 'snap-y snap-mandatory' : ''}`}
      style={{ scrollBehavior: isPackScrubbing ? "auto" : "smooth" }}
      data-home-mode={isCustomMode ? "custom" : "quick"}
      data-launching={isLaunching ? "true" : "false"}
      data-topic-count={games.length}
      data-item-count={allItems.length}
    >
      {/* Scrollable Track - height defined by number of items */}
      <div
        className="relative w-full"
        style={{ height: isLoading ? "100%" : `${TOTAL_HEIGHT}px` }}
      >
        {/* Snap Points for Mobile */}
        {isMobile && !isLoading && allItems.map((_, index) => (
          <div
            key={`snap-${index}`}
            className="absolute w-full pointer-events-none snap-start snap-always"
            style={{
              height: `${ITEM_HEIGHT}px`,
              top: `${index * ITEM_HEIGHT}px`,
            }}
          />
        ))}

        {/* Sticky Viewport - Standard CSS Sticky to keep UI fixed while scrolling */}
        <div className="sticky top-0 h-[100dvh] w-full overflow-hidden flex justify-center">
          <ThemeColorBlurBackground
            gameId={focusedGame.testID}
            palette={themeMeshPalette}
            reducedMotion={reducedMotion}
          />

          {isMobile && !isCustomMode && !isLaunching && focusedPackIndex >= 0 ? (
            <MobilePackProgress
              activeIndex={focusedPackIndex}
              games={filteredGames}
              label={t("gameLibrary.packProgress", {
                current: focusedPackIndex + 1,
                total: filteredGames.length,
              })}
              onScrubEnd={handleMobilePackScrubEnd}
              onScrubProgress={handleMobilePackScrubProgress}
              onScrubStart={handleMobilePackScrubStart}
              onSelectIndex={handleMobilePackSelect}
              uiColor={panelUiColor}
            />
          ) : null}

          <div className="relative w-full h-full max-w-[1400px]">

            {/* Two top-down figures enter from the top and bottom between the cards and copy. */}
            <motion.div
              key="conversation-figures"
              aria-hidden={isCustomMode}
              className="pointer-events-none absolute inset-y-0 left-1/2 z-[5] w-full -translate-x-1/2 overflow-hidden lg:w-[520px] xl:w-[650px] 2xl:w-[720px]"
              initial={false}
              animate={{
                filter: isCustomMode ? "blur(2px)" : "blur(0px)",
                opacity: isCustomMode ? 0.4 : 1,
              }}
              transition={{
                duration: reducedMotion ? 0 : 0.6,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <KneeConversationIllustration
                departureDelay={isLaunching ? 0.08 : 0}
                isDeparting={isLaunching}
                isEngaged={focusedGame.testID !== "intro-card" && focusedGame.testID !== "end-card"}
                isLoading={isLoading}
                scrollProgress={libraryScrollProgress}
                pullRotation={pullRotation}
                femaleClothingColor={femaleThemeColor}
                maleClothingColor={maleThemeColor}
                className="knee-conversation-background absolute inset-0 h-full w-full max-w-none"
              />
            </motion.div>

            <AnimatePresence initial={false}>
              {isLoading ? (
                <motion.div
                  key="library-loading-brand"
                  className="library-loading-brand"
                  initial={false}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reducedMotion ? 0 : 0.54, ease: deceleratingEase }}
                  role="status"
                  aria-live="polite"
                  aria-busy="true"
                >
                  <motion.h1
                    layoutId="frankcards-brand"
                    aria-label="FrankCards"
                    transition={{ layout: { duration: reducedMotion ? 0 : 0.92, ease: deceleratingEase } }}
                  >
                    <span className="sr-only">Frank</span>
                    <span aria-hidden="true" className="frank-signature" />
                    <span>Cards</span>
                  </motion.h1>
                  <p>{t("gameLibrary.loadingBody")}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* 1. Background & Intro Panel Layer */}
            {!isLoading ? (
              <motion.div
              layout="position"
              data-layer="library-copy"
              aria-hidden={isCustomMode}
              animate={{
                opacity: isCustomMode ? 0 : 1,
                x: isLaunching ? "110vw" : isCustomMode ? -24 : 0,
              }}
              transition={{
                delay: isLaunching && !reducedMotion ? 0.2 : 0,
                duration: reducedMotion ? 0 : isCustomMode ? 0.34 : 0.72,
                ease: deceleratingEase,
                layout: { duration: reducedMotion ? 0 : 0.58, ease: deceleratingEase },
              }}
              className={`absolute inset-0 w-full h-full flex items-center z-10 ${isCustomMode ? "pointer-events-none" : ""} ${isMobile ? 'justify-center' : 'justify-end pl-[380px] xl:pl-[520px]'}`}
            >
              <motion.div
                layout
                transition={{ layout: { duration: reducedMotion ? 0 : 0.58, ease: deceleratingEase } }}
                className={`game-library-copy transition-[width,padding] duration-300 ${
                isMobile
                  ? 'w-full max-w-2xl px-4 sm:px-8'
                  : 'w-full max-w-[30rem] px-8 pr-8 xl:max-w-2xl xl:pr-24'
                }`}
              >
                <AnimatePresence mode={isPackScrubbing ? "sync" : "wait"}>
                  <motion.div
                    layout
                    key={focusedGame.testID}
                    className="game-library-panel-slot"
                    custom={direction}
                    variants={panelVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      duration: reducedMotion ? 0 : isPackScrubbing ? 0.24 : 0.4,
                      layout: {
                        duration: reducedMotion ? 0 : isPackScrubbing ? 0.28 : 0.58,
                        ease: deceleratingEase,
                      },
                    }}
                    onAnimationComplete={notifyContourLayout}
                  >
                    {focusedGame.testID === "intro-card" ? (
                      <GameIntroPanel
                        onSwitchToCustom={onSwitchToCustom}
                        handleClick={handleClick}
                        uiColor={panelUiColor}
                      />
                    ) : focusedGame.testID === "end-card" ? (

                      <div className="text-center">

                        <button
                          onClick={() => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                          className="material-control theme-primary-control px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform"
                        >
                          {t("quickMode.backToTop")}
                        </button>
                      </div>
                    ) : (
                      <GameInfoPanel
                        game={focusedGame}
                        onStart={() => handleStartGame(focusedGame)}
                        showStartButton={true}
                        uiColor={panelUiColor}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Unlock Message */}
                <AnimatePresence>
                  {showUnlockMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="theme-primary-control fixed top-20 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full text-sm font-medium shadow-lg z-[100]"
                    >
                      {t("gameLibrary.premiumUnlocked")}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              </motion.div>
            ) : null}

            {/* 2. Wheel Layer - Desktop Only */}
            {!isCustomMode && !isMobile && !isLoading && (
              <CardWheel
                allItems={allItems}
                containerRef={containerRef}
                focusedGameId={focusedGameId}
                initialOffset={INITIAL_OFFSET}
                isLaunching={isLaunching}
                itemHeight={ITEM_HEIGHT}
                maxAngle={MAX_ANGLE}
                onStartGame={handleStartGame}
                radius={RADIUS}
                reducedMotion={reducedMotion}
                visibleRange={VISIBLE_RANGE}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


export default QuickGameLibrary;
