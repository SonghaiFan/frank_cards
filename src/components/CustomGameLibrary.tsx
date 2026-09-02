import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ConversationGame } from "../types/ConversationGame";
import { useEasterEgg } from "../hooks/useEasterEgg";
import CardPack from "./CardPack";
import FilterGroup from "./FilterGroup";

type PlayerGroup = "solo" | "couple" | "friends" | "strangers" | "family";
type GameType = "normal" | "edition" | "premium";

interface GameLibraryProps {
  games: ConversationGame[];
  communityGames: ConversationGame[];
  selectedGames: ConversationGame[];
  onToggleGame: (game: ConversationGame) => void;
  onClearSelection: () => void;
  onStartSession: () => void;
  onBackToQuick: () => void;
}

const GameLibrary: React.FC<GameLibraryProps> = ({ games, communityGames, selectedGames, onToggleGame, onStartSession, onBackToQuick, onClearSelection }) => {
  const { t } = useTranslation();
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);
  const [selectedGameIndex, setSelectedGameIndex] = useState(0); // For keyboard nav (focus)

  // Filters
  const [selectedType, setSelectedType] = useState<GameType | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<PlayerGroup | null>(null);
  const [showUnlockMessage, setShowUnlockMessage] = useState(false);
  const [collection, setCollection] = useState<"official" | "community">("official");
  const visibleGames = collection === "community" ? communityGames : games;

  // Easter egg hook for premium unlock
  const { handleClick, isUnlocked } = useEasterEgg({
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
  const filteredGames = visibleGames.filter((game) => {
    const typeMatch = !selectedType || game.app.type === selectedType;
    const groupMatch =
      !selectedGroup || game.app.playerGroup.includes(selectedGroup);
    const premiumAllowed = game.app.type !== "premium" || isUnlocked;
    return typeMatch && groupMatch && premiumAllowed;
  });

  // Reset selected index when filters change
  useEffect(() => {
    setSelectedGameIndex(0);
  }, [collection, selectedType, selectedGroup]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (filteredGames.length === 0) return;

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
    <div className="custom-game-library h-full w-full flex flex-col items-center px-4 sm:px-8 py-8 sm:py-16 overflow-y-auto relative">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        aria-label={t("common.back")}
        className="custom-library-back theme-interactive-text absolute w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center text-xl sm:text-2xl transition-colors duration-200 z-50"
        onClick={onBackToQuick}
        title={t("common.back")}
        type="button"
        whileTap={{ scale: 0.96 }}
      >
        ←
      </motion.button>

      {/* Header with Easter Egg */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="custom-library-header text-center max-w-2xl mb-8 sm:mb-16"
      >
        <div className="mb-10 sm:mb-6">
          <motion.button
            aria-label={t("customMode.title")}
            className="custom-library-title-trigger"
            onClick={handleClick}
            type="button"
            whileTap={{ scale: 0.95 }}
          >
            <h1 className="theme-text-primary text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-none">
              {t("customMode.title")}
            </h1>
          </motion.button>
        </div>
        <p className="theme-text-primary text-xl sm:text-2xl font-bold mb-2">
          {t("customMode.subtitle")}
        </p>
        <p className="theme-text-secondary text-lg sm:text-xl text-intimate font-light px-4 mb-6">
          {t("customMode.description")}
        </p>

        {/* Unlock Message */}
        <AnimatePresence>
          {showUnlockMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="theme-primary-control fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full text-sm font-medium shadow-lg z-50"
            >
              {t("gameLibrary.premiumUnlocked")}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="custom-library-collections" role="tablist" aria-label={t("customMode.collectionLabel")}>
        <button
          aria-selected={collection === "official"}
          className={collection === "official" ? "is-active" : ""}
          onClick={() => setCollection("official")}
          role="tab"
          type="button"
        >
          {t("customMode.official")}
        </button>
        <button
          aria-selected={collection === "community"}
          className={collection === "community" ? "is-active" : ""}
          onClick={() => setCollection("community")}
          role="tab"
          type="button"
        >
          {t("customMode.community")}
        </button>
      </div>

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
          <div className="theme-divider hidden sm:block w-px h-15 mx-4" />

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
          className="theme-text-tertiary text-center py-12"
        >
          <p>{t(collection === "community" && !selectedType && !selectedGroup ? "customMode.communityEmpty" : "gameLibrary.noResults")}</p>
        </motion.div>
      )}

      {/* Footer - Minimal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="theme-text-secondary text-center font-medium pb-24"
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
            className="fixed bottom-8 left-0 right-0 flex justify-center items-center z-50 pointer-events-none gap-4"
          >
            {/* Clear Selection Button */}
            <button
              onClick={onClearSelection}
              className="paper-control theme-secondary-control theme-danger-control pointer-events-auto h-[60px] w-[60px] rounded-full flex items-center justify-center hover:scale-110 transition-[transform,color,background-color]"
              aria-label="Clear selection"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <button
              onClick={onStartSession}
              className="material-control theme-primary-control pointer-events-auto font-bold text-lg px-8 py-4 rounded-full flex items-center gap-3 hover:scale-105 transition-transform"
            >
              <span>Play {selectedGames.length} Pack{selectedGames.length > 1 ? 's' : ''}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameLibrary;
