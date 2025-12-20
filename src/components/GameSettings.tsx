import React from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { ConversationGame } from "../types/ConversationGame";
import CategorySelector from "./CategorySelector";
import TimePercentageSlider from "./TimePercentageSlider";
import Button from "./Button";

interface GameSettingsProps {
  game: ConversationGame;
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  questionPercentage: number;
  onPercentageChange: (percentage: number) => void;
  isChaosMode: boolean;
  onChaosModeChange: (isChaos: boolean) => void;
  onStartGame: () => void;
  onBack: () => void;
}

const GameSettings: React.FC<GameSettingsProps> = ({
  game,
  selectedCategories,
  onCategoryChange,
  questionPercentage,
  onPercentageChange,
  isChaosMode,
  onChaosModeChange,
  onStartGame,
  onBack,
}) => {
  const { t } = useTranslation();

  return (
    <div className="h-full w-full bg-white dark:bg-black overflow-y-auto">
      <div className="min-h-full flex flex-col items-center justify-center px-4 sm:px-8 py-8 sm:py-16">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute top-4 left-4 sm:top-8 sm:left-8 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-xl sm:text-2xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
          onClick={onBack}
        >
          ←
        </motion.button>

        {/* Main Content Container */}
        <div className="text-center max-w-2xl w-full space-y-8 sm:space-y-10">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="space-y-2"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
              {t("gameInterface.createYourJourney")}
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 text-intimate font-light max-w-md mx-auto">
              {t("gameInterface.createJourneySubtitle")}
            </p>
          </motion.div>

          {/* Category Selection Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <CategorySelector
              game={game}
              selectedCategories={selectedCategories}
              onCategoryChange={onCategoryChange}
            />
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="w-16 h-px bg-gray-200 dark:bg-gray-600 mx-auto"
          />

          {/* Time Selection Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-4"
          >
            <TimePercentageSlider
              game={game}
              selectedCategories={selectedCategories}
              percentage={questionPercentage}
              onPercentageChange={onPercentageChange}
            />
          </motion.div>

          {/* Chaos Mode Toggle - Styled to match Section Headers */}
           <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="space-y-4"
          >
             <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-light text-gray-900 dark:text-white">
                  {t("gameInterface.chaosMode", "Chaos Shuffle")}
                </h2>
                <div className="flex items-center justify-center space-x-3 pt-2">
                   <p className="text-sm text-gray-600 dark:text-gray-300 font-light max-w-xs text-center">
                      {t("gameInterface.chaosModeDesc", "Mix all questions together, ignoring categories.")}
                   </p>
                    <label className="flex items-center cursor-pointer relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={isChaosMode}
                        onChange={(e) => onChaosModeChange(e.target.checked)}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors duration-300 ${isChaosMode ? 'bg-pink-400' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${isChaosMode ? 'transform translate-x-4' : ''}`}></div>
                    </label>
                </div>
             </div>
          </motion.div>

          {/* Action Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="pt-2 flex justify-center"
          >
            <Button
              variant="primary"
              onClick={onStartGame}
              disabled={selectedCategories.length === 0}
            >
              {t("gameInterface.beginTheJourney")}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GameSettings;
