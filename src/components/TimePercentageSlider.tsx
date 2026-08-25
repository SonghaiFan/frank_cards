import React from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { ConversationGame } from "../types/ConversationGame";

interface TimePercentageSliderProps {
  game: ConversationGame;
  selectedCategories: string[];
  percentage: number;
  onPercentageChange: (percentage: number) => void;
}

const TimePercentageSlider: React.FC<TimePercentageSliderProps> = ({
  game,
  selectedCategories,
  percentage,
  onPercentageChange,
}) => {
  const { t } = useTranslation();
  // Calculate total questions from selected categories
  const totalAvailableQuestions = selectedCategories.reduce(
    (total, categoryName) => {
      const categoryQuestions =
        game.questions.find((c) => c.category === categoryName)?.questions
          .length || 0;
      return total + categoryQuestions;
    },
    0
  );

  const estimatedQuestions = Math.round(
    (totalAvailableQuestions * percentage) / 100
  );
  const estimatedTime = Math.round(estimatedQuestions * 5); // 5 minutes per question

  // Calculate the progress percentage for better alignment
  const progressPercentage = ((percentage - 10) / (100 - 10)) * 100;

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6">
      {/* Section Header */}
      <div className="space-y-1">
        <h2 className="theme-text-primary text-xl sm:text-2xl font-light">
          {t("timePercentage.title")}
        </h2>
        <p className="theme-text-secondary text-sm sm:text-base text-intimate font-light">
          {t("timePercentage.subtitle")}
        </p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="theme-text-secondary text-xs sm:text-sm font-light"
        >
          {estimatedQuestions} questions • ~{estimatedTime} minutes together
        </motion.div>
      </div>

      {/* Intensity Display */}
      <div className="space-y-6">
        <div className="text-center space-y-4">
          {/* Slider */}
          <div className="px-2 sm:px-4">
            <div className="relative h-3 sm:h-2 mb-6 py-2">
              <div
                className="absolute inset-0 w-full h-2 rounded-full"
                style={{
                  background: `linear-gradient(to right, var(--slider-thumb) 0%, var(--slider-thumb) ${progressPercentage}%, var(--slider-track) ${progressPercentage}%, var(--slider-track) 100%)`,
                  zIndex: 1,
                }}
              />
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={percentage}
                onChange={(e) => onPercentageChange(parseInt(e.target.value))}
                className="absolute inset-0 w-full h-2 bg-transparent rounded-full appearance-none cursor-pointer slider focus:outline-none"
                style={{
                  background: "transparent",
                  zIndex: 20,
                }}
              />
            </div>

            <div className="theme-text-tertiary flex justify-between text-xs font-light">
              <span>{t("timePercentage.labels.light")}</span>
              <span>{t("timePercentage.labels.meaningful")}</span>
              <span>{t("timePercentage.labels.deep")}</span>
              <span>{t("timePercentage.labels.complete")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimePercentageSlider;
