import React from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { ConversationGame } from "../types/ConversationGame";

interface CategorySelectorProps {
  game: ConversationGame;
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  game,
  selectedCategories,
  onCategoryChange,
}) => {
  const { t } = useTranslation();

  const handleCategoryToggle = (categoryKey: string) => {
    if (selectedCategories.includes(categoryKey)) {
      onCategoryChange(selectedCategories.filter((cat) => cat !== categoryKey));
    } else {
      onCategoryChange([...selectedCategories, categoryKey]);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6">
      {/* Section Header */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-light text-gray-900 dark:text-white">
          {t("categorySelector.title")}
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 text-intimate font-light">
          {t("categorySelector.subtitle")}
        </p>
      </div>

      {/* Compact Categories Layout */}
      <div className="flex justify-center items-center gap-4 sm:gap-6 flex-wrap max-w-4xl mx-auto">
        {(() => {
          // Group categories by originGame
          const groupedCategories: Record<string, [string, any][]> = {};
          
          Object.entries(game.theme.categories).forEach(([key, category]) => {
            const origin = category.originGame || game.app.title;
            if (!groupedCategories[origin]) {
              groupedCategories[origin] = [];
            }
            groupedCategories[origin].push([key, category]);
          });

          const groups = Object.entries(groupedCategories);
          
          return groups.map(([origin, categories], groupIndex) => (
            <React.Fragment key={origin}>
              {/* Divider between game groups (but not before the first one) */}
              {groupIndex > 0 && (
                <div className="h-8 w-px bg-gray-300 dark:bg-gray-700 mx-2 sm:mx-4" />
              )}

              {/* Categories for this game */}
              {categories.map(([categoryKey, category]) => {
                const isSelected = selectedCategories.includes(categoryKey);

                // Find questions for this category using the key
                const categoryQuestions = game.questions.find(
                  (c) => c.category === categoryKey
                );
                const questionCount = categoryQuestions?.questions.length || 0;

                return (
                  <motion.div
                    key={categoryKey}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="flex flex-col items-center gap-2 sm:gap-3"
                  >
                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleCategoryToggle(categoryKey)}
                      className={`
                      relative w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full transition-all duration-300 cursor-pointer touch-manipulation
                      ${
                        isSelected
                          ? "shadow-lg scale-110"
                          : "hover:shadow-md opacity-60 hover:opacity-100 active:scale-95"
                      }
                    `}
                      style={{ backgroundColor: category.color }}
                      title={`${category.name} (${questionCount} questions)`}
                    >
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 0.3, ease: "backOut" }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <svg
                            className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </motion.div>
                      )}
                    </motion.button>

                    <div className="text-center max-w-[90px] space-y-0.5">
                       <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white leading-tight break-words">
                          {/* Remove appended game title from name if present */}
                          {category.name.replace(/\s*\(.*?\)$/, "")} 
                       </div>
                    </div>
                  </motion.div>
                );
              })}
            </React.Fragment>
          ));
        })()}
      </div>

      {/* Validation Message */}
      {selectedCategories.length === 0 && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-gray-600 dark:text-gray-400 font-light text-xs sm:text-sm px-4"
        >
          Select at least one area to begin your journey
        </motion.p>
      )}
    </div>
  );
};

export default CategorySelector;
