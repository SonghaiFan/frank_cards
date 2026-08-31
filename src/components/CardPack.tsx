import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ConversationGame } from "../types/ConversationGame";
import Card from "./Card";
import PackLikeButton from "./PackLikeButton";
import { useTranslation } from "react-i18next";

interface CardPackProps {
  game: ConversationGame;
  index: number;
  isSelected: boolean;
  isHovered: boolean;
  onToggle: (game: ConversationGame) => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  disableEntranceAnimation?: boolean;
  minimal?: boolean;
  showSelectionIndicator?: boolean;
  sharedLayoutId?: string;
  size?: "small" | "medium" | "large";
  style?: React.CSSProperties;
  className?: string;
}

const sizeClasses = {
  small: "w-full max-w-[300px] sm:max-w-[320px] h-[180px] sm:h-[200px]",
  medium: "w-[90vw] max-w-[360px] sm:max-w-[400px] h-[200px] sm:h-[250px]",
  large:
    "w-[92vw] max-w-[380px] sm:max-w-[440px] md:max-w-[520px] h-[220px] sm:h-[280px] md:h-[340px]",
};

const CardPack: React.FC<CardPackProps> = ({
  game,
  index,
  isSelected,
  isHovered,
  onToggle,
  onHoverStart,
  onHoverEnd,
  disableEntranceAnimation = false,
  minimal = false,
  showSelectionIndicator = true,
  sharedLayoutId,
  size = "medium",
  style,
  className = "cursor-pointer relative",
}) => {
  const { t } = useTranslation();

  if (minimal) isSelected = false;

  return (
    <motion.div
      layout={!disableEntranceAnimation}
      layoutId={sharedLayoutId}
      initial={disableEntranceAnimation ? false : { opacity: 0, y: 50 }}
      animate={disableEntranceAnimation ? undefined : { opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: "easeOut",
        layout: { duration: 0.72, ease: [0.22, 1, 0.36, 1] },
      }}
      className={`${className} ${!style ? sizeClasses[size] : ''}`} // Apply size class ONLY if no style override to prevent conflicts, or just append it
      style={{
        ...style,
        borderRadius: sharedLayoutId ? "1.5rem" : style?.borderRadius,
      }}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      onClick={
        minimal
          ? undefined
          : () => onToggle(game)
      }
    >
      {/* Card Pack Container */}
      <div className="relative w-full h-full"> {/* Ensure container fills wrapper */}
        {/* Background Cards - Dynamic based on categories */}
        <AnimatePresence>
          {(isHovered || isSelected) && (
            <>
              {Object.entries(game.theme.categories).map(
                (categoryEntry, cardIndex) => {
                  const [categoryKey, category] = categoryEntry;

                  return (
                    <Card
                      key={categoryKey}
                      size={size} // Pass size to card to maintain font/padding scaling
                      variant="game"
                      className="absolute top-0 left-0"
                      style={{
                        width: '100%',
                        height: '100%',
                        aspectRatio: style?.aspectRatio || "400/250",
                        backgroundColor: category.color,
                      }}
                      initial={{
                        x: 0,
                        y: 0,
                        rotate: 0,
                        scale: 1,
                        opacity: 0,
                      }}
                      animate={{
                        x: -12 * (cardIndex + 1),
                        y: -16 * (cardIndex + 1),
                        rotate: -2.5 * (cardIndex + 1),
                        scale: 1 - 0.04 * (cardIndex + 1),
                        opacity: 1,
                      }}
                      exit={{
                        x: 0,
                        y: 0,
                        rotate: 0,
                        scale: 1,
                        opacity: 0,
                      }}
                      transition={{
                        duration: 0.3,
                        ease: "easeOut",
                        delay: 0.05 + cardIndex * 0.02,
                      }}
                    />
                  );
                }
              )}
            </>
          )}
        </AnimatePresence>

        {/* Main Card - Always visible (White Cover) */}
        <Card
          size={size} // Pass size
          variant="game"
          className={`relative z-10 cursor-pointer transition-shadow duration-300 ${isSelected
              ? "paper-card-selected"
              : ""
            } ${minimal ? 'justify-center items-center opacity-80 hover:opacity-100' : ''}`}
          style={{
            width: '100%',
            height: '100%',
            aspectRatio: style?.aspectRatio || "400/250",
            backgroundColor: "var(--paper-card)",
          }}
          whileHover={{
            scale: 1.02,
            y: -4,
          }}
          whileTap={{ scale: 0.98 }}
          transition={{
            duration: 0.2,
            ease: "easeOut",
          }}
        >
          {/* Selected Checkmark Overlay */}
          {isSelected && showSelectionIndicator && (
            <div className="theme-primary-control absolute top-4 right-4 rounded-full p-1 shadow-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}

          {!minimal ? <PackLikeButton packId={game.testID} /> : null}

          {/* Game Title */}
          <h2 className="theme-text-primary text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center leading-tight px-2">
            {game.app.title}
          </h2>

          {/* Game Description */}
          <p className="theme-text-secondary text-xs sm:text-sm font-medium text-center leading-relaxed px-2">
            {game.app.subtitle}
          </p>

          {game.creator ? (
            <div className="pack-creator">
              <span className="pack-creator-avatar" aria-hidden="true">
                {game.creator.avatarUrl ? (
                  <img src={game.creator.avatarUrl} alt="" />
                ) : (
                  (game.creator.displayName || "F").charAt(0).toUpperCase()
                )}
              </span>
              <span>{game.creator.displayName || t("customMode.communityCreator")}</span>
            </div>
          ) : null}

          {/* Category Dots */}
          <div className="flex justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
            {Object.values(game.theme.categories).map((category, index) => (
              <div
                key={index}
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
                style={{ backgroundColor: category.color }}
                title={category.name}
              />
            ))}
          </div>

          {/* Card Count Indicator - Hidden in minimal mode */}
          {!minimal && (
            <div className="theme-text-secondary mt-3 sm:mt-4 text-xs font-semibold uppercase tracking-wider text-center px-2">
              {game.questions.reduce(
                (total: number, category: any) =>
                  total + category.questions.length,
                0
              )}{" "}
              Cards • {Object.keys(game.theme.categories).length} Categories
            </div>
          )}
        </Card>
      </div>
    </motion.div>
  );
};

export default CardPack;
