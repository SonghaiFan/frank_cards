import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ConversationGame } from "../types/ConversationGame";
import CardPack from "./CardPack";
import { useTranslation } from "react-i18next";
import GameInfoPanel from "./GameInfoPanel";
import GameIntroPanel from "./GameIntroPanel";
import KneeConversationIllustration from "./KneeConversationIllustration";
import { useEasterEgg } from "../hooks/useEasterEgg";
import { LIBRARY_DESKTOP_QUERY, useMediaQuery } from "../hooks/useMediaQuery";
import { useAppTheme } from "../hooks/useAppTheme";
import { resolveGameSurfaceTheme } from "../utils/gameTheme";


interface QuickGameLibraryProps {
  games: ConversationGame[];
  onStartGame: (game: ConversationGame) => void;
  onSwitchToCustom: () => void;
}

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
              <CardPack
                game={game}
                index={index}
                isSelected={focusedGameId === game.testID}
                isHovered={false}
                onToggle={() => onStartGame(game)}
                onHoverStart={() => {}}
                onHoverEnd={() => {}}
                minimal={isPlaceholder}
                sharedLayoutId={focusedGameId === game.testID && !isPlaceholder ? `active-card-${game.testID}` : undefined}
                disableEntranceAnimation={true}
                style={{ width: "400px", height: "250px" }}
                className="relative cursor-pointer group shadow-2xl rounded-3xl"
              />
            </div>
          );
        })}
      </div>
    </motion.div>
  );
});

const QuickGameLibrary: React.FC<QuickGameLibraryProps> = ({
  games,
  onStartGame,
  onSwitchToCustom,
}) => {
  const reducedMotion = useReducedMotion();
  const [focusedGameId, setFocusedGameId] = useState<string>(games[0]?.testID || "");
  const [direction, setDirection] = useState(1); // 1 = down/next, -1 = up/prev
  const [isLaunching, setIsLaunching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingGameRef = useRef<ConversationGame | null>(null);
  const lastIndexRef = useRef(0);
  const notifyContourLayout = useCallback(() => {
    document.dispatchEvent(new Event("frankcards:figure-layout"));
  }, []);

  const { t } = useTranslation();
  const [showUnlockMessage, setShowUnlockMessage] = useState(false);

  // Easter egg hook for premium unlock
  const { handleClick, isUnlocked, clickProgress } = useEasterEgg({
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
  const isDarkTheme = useAppTheme() === "dark";

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
    ui: { startScreen: { title: "", description: [], startButton: "" }, navigation: { nextButton: "", prevButton: "" }, endScreen: { title: "", subtitle: "", restartButton: "" } },
    theme: { categories: {} },
    questions: [],
  }), [t]);

  const endGame = useMemo<ConversationGame>(() => ({
    testID: "end-card",
    app: { title: t("quickMode.cta2"), subtitle: "", language: "", type: "normal", playerGroup: [] },
    ui: { startScreen: { title: "", description: [], startButton: "" }, navigation: { nextButton: "", prevButton: "" }, endScreen: { title: "", subtitle: "", restartButton: "" } },
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
  }, [allItems, ITEM_HEIGHT]);

  const focusedGame = allItems.find((g) => g.testID === focusedGameId) || allItems[0];
  const focusedThemeColors = Object.values(focusedGame.theme.categories).map((category) => category.color);
  const femaleThemeColor = focusedThemeColors[0];
  const maleThemeColor = focusedThemeColors[1] || createCompanionColor(femaleThemeColor);
  const backgroundThemeColors = focusedThemeColors.length > 1
    ? focusedThemeColors
    : [femaleThemeColor || "#9ca283", maleThemeColor || "#9ab1cc"];
  const themeMeshPalette = createThemeMeshPalette(backgroundThemeColors);
  const panelTheme = resolveGameSurfaceTheme({
    categoryColor: backgroundThemeColors[backgroundThemeColors.length - 1],
    isDarkTheme,
  });

  const handleStartGame = useCallback((game: ConversationGame) => {
    if (isLaunching || game.testID === "intro-card" || game.testID === "end-card") return;

    if (reducedMotion) {
      onStartGame(game);
      return;
    }

    pendingGameRef.current = game;
    setIsLaunching(true);
  }, [isLaunching, onStartGame, reducedMotion]);

  const handleLaunchAnimationComplete = useCallback(() => {
    if (!isLaunching || !pendingGameRef.current) return;

    const game = pendingGameRef.current;
    pendingGameRef.current = null;
    onStartGame(game);
  }, [isLaunching, onStartGame]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-white dark:bg-black ${isLaunching ? 'overflow-hidden' : 'overflow-y-auto'} overflow-x-hidden no-scrollbar scroll-smooth ${isMobile ? 'snap-y snap-mandatory' : ''}`}
      style={{ scrollBehavior: 'smooth' }}
      data-launching={isLaunching ? "true" : "false"}
      data-topic-count={games.length}
      data-item-count={allItems.length}
    >
      {/* Scrollable Track - height defined by number of items */}
      <div
        className="relative w-full"
        style={{ height: `${TOTAL_HEIGHT}px` }}
      >
        {/* Snap Points for Mobile */}
        {isMobile && allItems.map((_, index) => (
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
        <div className="sticky top-0 h-screen w-full overflow-hidden flex justify-center">
          <ThemeColorBlurBackground
            gameId={focusedGame.testID}
            palette={themeMeshPalette}
            reducedMotion={reducedMotion}
          />

          <div className="relative w-full h-full max-w-[1400px]">

            {/* Two top-down figures enter from the top and bottom between the cards and copy. */}
            <div
              key="conversation-figures"
              className="pointer-events-none absolute inset-y-0 left-1/2 z-[5] w-full -translate-x-1/2 overflow-hidden lg:w-[520px] xl:w-[650px] 2xl:w-[720px]"
            >
              <KneeConversationIllustration
                departureDelay={isLaunching ? 0.08 : 0}
                isDeparting={isLaunching}
                isEngaged={focusedGame.testID !== "intro-card" && focusedGame.testID !== "end-card"}
                femaleClothingColor={femaleThemeColor}
                maleClothingColor={maleThemeColor}
                className="knee-conversation-background absolute inset-0 h-full w-full max-w-none"
              />
            </div>

            {/* 1. Background & Intro Panel Layer */}
            <motion.div
              data-layer="library-copy"
              animate={{ x: isLaunching ? "110vw" : 0 }}
              transition={{
                delay: isLaunching && !reducedMotion ? 0.2 : 0,
                duration: reducedMotion ? 0 : 0.72,
                ease: [0.22, 1, 0.36, 1],
              }}
              onAnimationComplete={handleLaunchAnimationComplete}
              className={`absolute inset-0 w-full h-full flex items-center z-10 ${isMobile ? 'justify-center' : 'justify-end pl-[380px] xl:pl-[520px]'}`}
            >
              <div className={`transition-all duration-300 ${
                isMobile
                  ? 'w-full max-w-2xl px-4 sm:px-8'
                  : 'w-full max-w-[30rem] px-8 pr-8 xl:max-w-2xl xl:pr-24'
              }`}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={focusedGame.testID}
                    custom={direction}
                    variants={panelVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.4 }}
                    onAnimationComplete={notifyContourLayout}
                  >
                    {focusedGame.testID === "intro-card" ? (
                      <GameIntroPanel
                        onSwitchToCustom={onSwitchToCustom}
                        handleClick={handleClick}
                        clickProgress={clickProgress}
                        uiColor={panelTheme.uiColor}
                      />
                    ) : focusedGame.testID === "end-card" ? (

                      <div className="text-center">

                        <button
                          onClick={() => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                          className="material-control px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold hover:scale-105 transition-transform"
                        >
                          {t("quickMode.backToTop")}
                        </button>
                      </div>
                    ) : (
                      <GameInfoPanel
                        game={focusedGame}
                        onStart={() => handleStartGame(focusedGame)}
                        showStartButton={true}
                        uiColor={panelTheme.uiColor}
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
                      className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-black text-white px-6 py-3 rounded-full text-sm font-medium shadow-lg z-[100]"
                    >
                      {t("gameLibrary.premiumUnlocked")}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Mobile Scroll Hint */}
            <AnimatePresence>
              {isMobile && focusedGame.testID === "intro-card" && (
                <motion.div
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: 1, y: 10 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut"
                  }}
                  className="absolute bottom-8 left-0 right-0 flex justify-center items-center z-50 pointer-events-none"
                >
                  <div className="p-2 bg-white/10 dark:bg-black/10 backdrop-blur-sm rounded-full">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-black dark:text-white opacity-60"
                    >
                      <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
                    </svg>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 2. Wheel Layer - Desktop Only */}
            {!isMobile && (
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
