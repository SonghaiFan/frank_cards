import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ConversationGame } from "../types/ConversationGame";
import CardPack from "./CardPack";
import Card from "./Card";
import GameInfoPanel from "./GameInfoPanel";
import GameIntroPanel from "./GameIntroPanel";

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
  const containerRef = useRef<HTMLDivElement>(null);

  // Constants for geometry
  // Constants for geometry
  const ITEM_HEIGHT = 200; 
  const RADIUS = 800; 
  const MAX_ANGLE = 60; 

  const INTRO_GAME: ConversationGame = {
    testID: "intro-card",
    app: { 
        title: "", 
        subtitle: "", 
        language: "", 
        type: "normal", 
        playerGroup: [] 
    },
    ui: {
        startScreen: { title: "", description: [], startButton: "" },
        navigation: { nextButton: "", prevButton: "" },
        endScreen: { title: "", subtitle: "", restartButton: "" }
    },
    theme: { categories: {} },
    questions: []
  };

  const allItems = [INTRO_GAME, ...games];

  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
            <div className="max-w-4xl w-full px-8 pl-32 sm:pl-48">
              <AnimatePresence mode="wait">
                <motion.div
                  key={focusedGame.testID}
                  initial={{ opacity: 0, x: 50, filter: "blur(5px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, x: -50, filter: "blur(5px)" }}
                  transition={{ duration: 0.4 }}
                >
                    {focusedGame.testID === "intro-card" ? (
                        <GameIntroPanel 
                            onSwitchToCustom={onSwitchToCustom}
                        />
                    ) : (
                        <GameInfoPanel
                            game={focusedGame}
                            onStart={() => onStartGame(focusedGame)}
                            showStartButton={true}
                        />
                    )}
                </motion.div>
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

          {/* 2. Wheel Layer */}
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
                if (Math.abs(relativePos) > 2) return null;

                // 2D Arc Calculation
                const angleDeg = relativePos * MAX_ANGLE;
                const angleRad = (angleDeg * Math.PI) / 180;
                const translateX = (Math.cos(angleRad) * RADIUS) - RADIUS + 50;

                // Arc Logic: Y = 50vh + (R * sin(theta))
                const arcY = (Math.sin(angleRad) * RADIUS);

                const scale = Math.max(0, 1 - Math.abs(relativePos) * 0.4);
                const opacity = Math.max(0, 1 - Math.abs(relativePos) * 0.6);
                
                const isIntro = game.testID === "intro-card";

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
                    {isIntro ? (
                        <Card
                            variant="default"
                            size="medium"
                            className="bg-white dark:bg-black relative flex flex-col items-center justify-center text-center shadow-xl border-2 border-gray-100 dark:border-gray-800"
                             style={{
                                width: '400px',
                                height: '250px',
                            }}
                            onClick={() => {
                                 containerRef.current?.scrollTo({ top: ITEM_HEIGHT, behavior: 'smooth' });
                            }}
                        >
                            {/* Logo Section */}
                            <div className="flex items-center gap-3 mb-6">
                                {/* Icon */}
                                <img src="/icon.png" alt="CueCards Logo" className="w-20 h-20" />
                                {/* Text */}
                                <h3 className="text-4xl font-black text-black dark:text-white tracking-tight">
                                    CueCards
                                </h3>
                            </div>

                        </Card>
                    ) : (
                    <CardPack
                      game={game}
                      index={index}
                      isSelected={focusedGameId === game.testID}
                      isHovered={false}
                      onToggle={() => onStartGame(game)}
                      onHoverStart={() => {}}
                      onHoverEnd={() => {}}
                      disableEntranceAnimation={true}
                      style={{
                        width: '400px',
                        height: '250px',
                      }}
                      className="relative cursor-pointer group shadow-2xl rounded-3xl"
                    />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default QuickGameLibrary;
