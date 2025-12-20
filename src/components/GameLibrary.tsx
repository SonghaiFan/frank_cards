import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ConversationGame } from "../types/ConversationGame";
import { useEasterEgg } from "../hooks/useEasterEgg";
import CardPack from "./CardPack";
import LanguageSwitcher from "./LanguageSwitcher";
import FilterGroup from "./FilterGroup";

type PlayerGroup = "solo" | "couple" | "friends" | "strangers" | "family";
type GameType = "normal" | "edition" | "premium";

interface GameLibraryProps {
  games: ConversationGame[];
  selectedGames: ConversationGame[];
  onToggleGame: (game: ConversationGame) => void;
  onStartSession: () => void;
}

const GameLibrary: React.FC<GameLibraryProps> = ({ games, selectedGames, onToggleGame, onStartSession }) => {
  const { t } = useTranslation();
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);
  const [selectedGameIndex, setSelectedGameIndex] = useState(0); // For keyboard nav (focus)
  
  // Filters
  const [selectedType, setSelectedType] = useState<GameType | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<PlayerGroup | null>(null);
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

  // Get unique game types and player groups
  const gameTypes: GameType[] = ["normal", "edition", "premium"];
  const playerGroups: PlayerGroup[] = [
    "solo",
    "couple",
    "friends",
    "strangers",
    "family",
  ];

  // Filter games based on selected type and group, considering unlock status
  const filteredGames = games.filter((game) => {
    const typeMatch = !selectedType || game.app.type === selectedType;
    const groupMatch =
      !selectedGroup || game.app.playerGroup.includes(selectedGroup);
    const premiumAllowed = game.app.type !== "premium" || isUnlocked;
    return typeMatch && groupMatch && premiumAllowed;
  });

  // Reset selected index when filters change
  useEffect(() => {
    setSelectedGameIndex(0);
  }, [selectedType, selectedGroup]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowLeft":
        case "ArrowUp":
          event.preventDefault();
          setSelectedGameIndex((prev) =>
            prev > 0 ? prev - 1 : filteredGames.length - 1
          );
          break;
        case "ArrowRight":
        case "ArrowDown":
          event.preventDefault();
          setSelectedGameIndex((prev) =>
            prev < filteredGames.length - 1 ? prev + 1 : 0
          );
          break;
        case "Enter":
        case " ": // Spacebar
          event.preventDefault();
          if (filteredGames[selectedGameIndex]) {
            onToggleGame(filteredGames[selectedGameIndex]);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredGames, selectedGameIndex, onToggleGame]);

  // Update hover when keyboard selection changes
  useEffect(() => {
    if (filteredGames[selectedGameIndex]) {
      setHoveredGame(filteredGames[selectedGameIndex].testID);
    }
  }, [selectedGameIndex, filteredGames]);

  const isGameSelected = (gameId: string) => {
    return selectedGames.some(g => g.testID === gameId);
  };

  return (
    <div className="h-full w-full bg-white dark:bg-black flex flex-col items-center px-4 sm:px-8 py-8 sm:py-16 overflow-y-auto relative">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
        <LanguageSwitcher />
      </div>

      {/* Header with Easter Egg */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center max-w-2xl mb-8 sm:mb-16 mt-8 sm:mt-0"
      >
        {/* App Title with Interactive Icon */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-10 sm:mb-6">
          <motion.div
            className="relative cursor-pointer"
            onClick={handleClick}
            whileTap={{ scale: 0.95 }}
          >
            <motion.img
              src="/card-icon.svg"
              alt="CueCards Icon"
              className="w-20 h-20 md:w-24 md:h-24 object-contain"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
            {/* Subtle progress indicator */}
            {clickProgress > 0 && clickProgress < 1 && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-black"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: [0, 0.2, 0],
                  scale: [0.8, 1.1, 1.2],
                }}
                transition={{
                  duration: 0.5,
                  times: [0, 0.5, 1],
                  repeat: 0,
                }}
              />
            )}
          </motion.div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-gray-900 dark:text-white tracking-tight leading-none text-center">
            CueCards
          </h1>
        </div>
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 text-intimate font-light px-4 mb-2 sm:mb-6">
          {t("gameLibrary.subtitle")}
        </p>

        {/* Unlock Message */}
        <AnimatePresence>
          {showUnlockMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-black text-white px-6 py-3 rounded-full text-sm font-medium shadow-lg"
            >
              {t("gameLibrary.premiumUnlocked")}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full max-w-5xl"
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center rounded-2xl p-6 mb-24 sm:mb-20">
          {/* Game Type Filter */}
          <FilterGroup
            title={t("gameLibrary.filterByType")}
            allLabel={t("gameLibrary.allTypes")}
            options={gameTypes}
            selectedValue={selectedType}
            onSelectionChange={setSelectedType}
            translationKey="gameLibrary.type"
          />

          {/* Vertical Separator for Desktop */}
          <div className="hidden sm:block w-px h-15 bg-gray-200 dark:bg-gray-700 mx-4" />

          {/* Player Group Filter */}
          <FilterGroup
            title={t("gameLibrary.filterByGroup")}
            allLabel={t("gameLibrary.allGroups")}
            options={playerGroups}
            selectedValue={selectedGroup}
            onSelectionChange={setSelectedGroup}
            translationKey="gameLibrary.group"
          />
        </div>
      </motion.div>

      {/* Games Grid with Enhanced Animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12 mb-32 justify-items-center"
      >
        {filteredGames.map((game, index) => {
           const isSelected = isGameSelected(game.testID);
           const isHovered = hoveredGame === game.testID;
           
           return (
             <CardPack
                key={game.testID}
                game={game}
                index={index}
                isSelected={isSelected}
                isHovered={isHovered}
                onToggle={onToggleGame}
                onHoverStart={() => {
                    setHoveredGame(game.testID);
                    setSelectedGameIndex(index);
                }}
                onHoverEnd={() => setHoveredGame(null)}
             />
        );
      })}
      </motion.div>

      {/* No Results Message */}
      {filteredGames.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-gray-500 py-12"
        >
          <p>{t("gameLibrary.noResults")}</p>
        </motion.div>
      )}

      {/* Footer - Minimal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-gray-600 font-medium pb-24"
      >
        <p className="text-sm">{t("gameLibrary.footnote")}</p>
      </motion.div>

      {/* Floating Action Bar (Start Session) */}
      <AnimatePresence>
      {selectedGames.length > 0 && (
          <motion.div
             initial={{ y: 100, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             exit={{ y: 100, opacity: 0 }}
             className="fixed bottom-8 left-0 right-0 flex justify-center z-50 pointer-events-none"
          >
              <button 
                onClick={onStartSession}
                className="pointer-events-auto shadow-2xl bg-black dark:bg-white text-white dark:text-black font-bold text-lg px-8 py-4 rounded-full flex items-center gap-3 hover:scale-105 transition-transform"
              >
                  <span>Play {selectedGames.length} Pack{selectedGames.length > 1 ? 's' : ''}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
              </button>
          </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};

export default GameLibrary;
