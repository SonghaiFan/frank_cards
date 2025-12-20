import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ConversationGame } from "../types/ConversationGame";
import CardPack from "./CardPack";
import { useTranslation } from "react-i18next";
import GameInfoPanel from "./GameInfoPanel";
import GameIntroPanel from "./GameIntroPanel";
import { useEasterEgg } from "../hooks/useEasterEgg";


interface QuickGameLibraryProps {
  games: ConversationGame[];
  onStartGame: (game: ConversationGame) => void;
  onSwitchToCustom: () => void;
}

const QuickGameLibrary: React.FC<QuickGameLibraryProps> = ({
  games,
  onStartGame,
  onSwitchToCustom,
}) => {
  const [focusedGameId, setFocusedGameId] = useState<string>(games[0]?.testID || "");
  const [scrollTop, setScrollTop] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = down/next, -1 = up/prev
  const containerRef = useRef<HTMLDivElement>(null);
  const lastIndexRef = useRef(0);

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
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
      setViewportWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = viewportWidth < 768; // md breakpoint

  // Constants for geometry
  const ITEM_HEIGHT = isMobile ? 180 : 200;
  const RADIUS = isMobile ? 500 : 800;
  const MAX_ANGLE = 60;
  const VISIBLE_RANGE = isMobile ? 1.5 : 2; // Show fewer items on mobile to avoid clutter

  const INTRO_GAME: ConversationGame = {
    testID: "intro-card",
    app: { title: t("quickMode.title"), subtitle: t("quickMode.cta"), language: "", type: "normal", playerGroup: [] },
    ui: { startScreen: { title: "", description: [], startButton: "" }, navigation: { nextButton: "", prevButton: "" }, endScreen: { title: "", subtitle: "", restartButton: "" } },
    theme: { categories: {} },
    questions: []
  };

  const END_GAME: ConversationGame = {
    testID: "end-card",
    app: { title: t("quickMode.cta2"), subtitle: "", language: "", type: "normal", playerGroup: [] },
    ui: { startScreen: { title: "", description: [], startButton: "" }, navigation: { nextButton: "", prevButton: "" }, endScreen: { title: "", subtitle: "", restartButton: "" } },
    theme: { categories: {} },
    questions: []
  };

  const filteredGames = games.filter((game) => {
    return game.app.type !== "premium" || isUnlocked;
  });

  const allItems = [INTRO_GAME, ...filteredGames, END_GAME];




  // Dynamic calculations
  const INITIAL_OFFSET = viewportHeight / 2 - ITEM_HEIGHT / 2;
  const TOTAL_HEIGHT = allItems.length * ITEM_HEIGHT + viewportHeight;

  // Scroll Handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container) {
        setScrollTop(container.scrollTop);

        const index = Math.round(container.scrollTop / ITEM_HEIGHT);

        if (index !== lastIndexRef.current) {
          setDirection(index > lastIndexRef.current ? 1 : -1);
          lastIndexRef.current = index;
        }

        const safeIndex = Math.max(0, Math.min(allItems.length - 1, index));
        const game = allItems[safeIndex];
        if (game && game.testID !== focusedGameId) {
          setFocusedGameId(game.testID);
        }
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    // Initialize focus logic
    handleScroll();

    return () => container.removeEventListener("scroll", handleScroll);
  }, [allItems, focusedGameId, viewportHeight]);

  const focusedGame = allItems.find((g) => g.testID === focusedGameId) || allItems[0];

  const variants = {
    enter: (direction: number) => ({
      y: direction > 0 ? 50 : -50,
      opacity: 0,
      filter: "blur(5px)"
    }),
    center: {
      y: 0,
      opacity: 1,
      filter: "blur(0px)"
    },
    exit: (direction: number) => ({
      y: direction > 0 ? -50 : 50,
      opacity: 0,
      filter: "blur(5px)"
    })
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-white dark:bg-black overflow-y-auto overflow-x-hidden no-scrollbar scroll-smooth"
      style={{ scrollBehavior: 'smooth' }}
    >
      {/* Scrollable Track - height defined by number of items */}
      <div
        className="relative w-full"
        style={{ height: `${TOTAL_HEIGHT}px` }}
      >
        {/* Sticky Viewport - Standard CSS Sticky to keep UI fixed while scrolling */}
        <div className="sticky top-0 h-screen w-full overflow-hidden">

          {/* 1. Background & Intro Panel Layer */}
          <div className="absolute inset-0 w-full h-full flex items-center justify-center z-10">
            <div className={`max-w-4xl w-full px-8 transition-all duration-300 ${isMobile ? 'pl-8' : 'pl-48'}`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={focusedGame.testID}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4 }}
                >
                  {focusedGame.testID === "intro-card" ? (
                    <GameIntroPanel
                      onSwitchToCustom={onSwitchToCustom}
                      handleClick={handleClick}
                      clickProgress={clickProgress}
                    />
                  ) : focusedGame.testID === "end-card" ? (

                    <div className="text-center">
                   
                      <button
                        onClick={() => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="px-8 py-3 bg-black text-white rounded-full font-bold hover:scale-105 transition-transform shadow-lg border border-gray-200 dark:border-gray-700"
                      >
                        {t("quickMode.backToTop")}
                      </button>
                    </div>
                  ) : (
                    <GameInfoPanel
                      game={focusedGame}
                      onStart={() => onStartGame(focusedGame)}
                      showStartButton={true}
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


            {/* Ambient BG */}
            <AnimatePresence mode="popLayout">
              <motion.div
                key={focusedGame.testID + "-bg"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 z-[-1]"
              >
                {focusedGame.testID !== "intro-card" && (
                  <div
                    className="absolute right-0 top-0 bottom-0 w-2/3 bg-gradient-to-l from-current to-transparent opacity-5"
                    style={{ color: Object.values(focusedGame.theme.categories)[0]?.color || '#000' }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 2. Wheel Layer - Desktop Only */}
          {!isMobile && (
            <div className="absolute top-0 left-0 bottom-0 w-[400px] sm:w-[500px] pointer-events-none z-20 flex items-center overflow-visible">
              <div className="relative w-full h-full">
                {allItems.map((game, index) => {
                  // Calculate position relative to viewport center
                  // Item's virtual Y position
                  const itemY = index * ITEM_HEIGHT + (ITEM_HEIGHT / 2) + INITIAL_OFFSET;
                  // Current Scroll Center
                  const scrollCenter = scrollTop + (containerRef.current?.clientHeight || window.innerHeight) / 2;

                  // Difference
                  const dist = itemY - scrollCenter;

                  // Normalize (-1 to 1 range roughly within view)
                  const relativePos = dist / 600;

                  // If out of view, hide
                  if (Math.abs(relativePos) > VISIBLE_RANGE) return null;

                  // 2D Arc Calculation
                  const angleDeg = relativePos * MAX_ANGLE;
                  const angleRad = (angleDeg * Math.PI) / 180;
                  const translateX = (Math.cos(angleRad) * RADIUS) - RADIUS + 50;

                  // Arc Logic: Y = 50vh + (R * sin(theta))
                  const arcY = (Math.sin(angleRad) * RADIUS);

                  const scale = Math.max(0, 1 - Math.abs(relativePos) * 0.4);
                  const opacity = Math.max(0, 1 - Math.abs(relativePos) * 0.6);

                  const isPlaceholder = game.testID === "intro-card" || game.testID === "end-card";

                  return (
                    <div
                      key={game.testID}
                      className="absolute left-4 top-1/2 w-full flex justify-center pointer-events-auto transition-transform duration-75 ease-out"
                      style={{
                        marginTop: '-125px',
                        transform: `
                                        translateY(${arcY}px)
                                        translateX(${translateX}px)
                                        rotateZ(${angleDeg}deg)
                                        scale(${scale})
                                    `,
                        opacity: opacity,
                        zIndex: Math.round(100 - Math.abs(relativePos) * 100)
                      }}
                    >
                      <CardPack
                        game={game}
                        index={index}
                        isSelected={focusedGameId === game.testID}
                        isHovered={false}
                          onToggle={() => onStartGame(game)}
                          onHoverStart={() => { }}
                          onHoverEnd={() => { }}
                          minimal={isPlaceholder}
                          disableEntranceAnimation={true}
                          style={{
                            width: isMobile ? '300px' : '400px',
                            height: isMobile ? '190px' : '250px',
                          }}
                          className="relative cursor-pointer group shadow-2xl rounded-3xl"
                        />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default QuickGameLibrary;
