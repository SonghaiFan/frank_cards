import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { ConversationGame } from "../types/ConversationGame";
import { useAppTheme } from "../hooks/useAppTheme";
import { LIBRARY_DESKTOP_QUERY, useMediaQuery } from "../hooks/useMediaQuery";
import { resolveGameSurfaceTheme } from "../utils/gameTheme";
import QuestionCard from "./QuestionCard";

const SWIPE_THRESHOLD_PX = 48;
const SWIPE_AXIS_BIAS = 1.15;

interface SwipeStart {
  pointerId: number;
  x: number;
  y: number;
  captured: boolean;
}

interface GamePlayProps {
  game: ConversationGame;
  questions: any[];
  onExit: () => void;
  onComplete: () => void;
  sessionEntryId?: string;
}

const GamePlay: React.FC<GamePlayProps> = ({
  game,
  questions,
  onExit,
  onComplete,
  sessionEntryId,
}) => {
  const { t } = useTranslation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [direction, setDirection] = useState(0);
  const isDarkTheme = useAppTheme() === "dark";
  const isDesktop = useMediaQuery(LIBRARY_DESKTOP_QUERY);
  const isMobile = !isDesktop;
  const swipeStartRef = useRef<SwipeStart | null>(null);
  const suppressCardClickUntilRef = useRef(0);

  const currentQuestion = questions[currentQuestionIndex] || null;
  const currentCategory = currentQuestion
    ? game.theme.categories[currentQuestion.category]
    : null;

  // Color logic based on Theme × Mode
  const isWildMode = currentQuestion?.type === "wildcard";
  const categoryColor = currentCategory?.color || "#fdfdfa";

  const {
    backgroundColor,
    cardColor,
    cardTextColor: textColor,
    uiColor,
  } = resolveGameSurfaceTheme({
    categoryColor,
    isDarkTheme,
    isWildcard: isWildMode,
  });

  const handleNext = useCallback(() => {
    setDirection(1);
    setIsCardFlipped(false);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      onComplete();
    }
  }, [currentQuestionIndex, onComplete, questions.length]);

  const handlePrevious = useCallback(() => {
    setDirection(-1);
    setIsCardFlipped(false);
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  }, [currentQuestionIndex]);

  const handleCardClick = useCallback(() => {
    if (Date.now() < suppressCardClickUntilRef.current) return;

    if (currentQuestion?.more) {
      setIsCardFlipped((flipped) => !flipped);
    }
  }, [currentQuestion?.more]);

  const handleSwipeStart = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobile || !event.isPrimary) return;

    swipeStartRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      captured: false,
    };
  }, [isMobile]);

  const handleSwipeMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const swipeStart = swipeStartRef.current;
    if (!isMobile || !swipeStart || swipeStart.pointerId !== event.pointerId || swipeStart.captured) {
      return;
    }

    const horizontalDistance = event.clientX - swipeStart.x;
    const verticalDistance = event.clientY - swipeStart.y;
    const hasHorizontalIntent =
      Math.abs(horizontalDistance) > 8 &&
      Math.abs(horizontalDistance) > Math.abs(verticalDistance) * SWIPE_AXIS_BIAS;

    if (hasHorizontalIntent) {
      event.currentTarget.setPointerCapture(event.pointerId);
      swipeStart.captured = true;
    }
  }, [isMobile]);

  const handleSwipeEnd = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const swipeStart = swipeStartRef.current;
    swipeStartRef.current = null;

    if (!isMobile || !swipeStart || swipeStart.pointerId !== event.pointerId) return;

    const horizontalDistance = event.clientX - swipeStart.x;
    const verticalDistance = event.clientY - swipeStart.y;
    const isHorizontalSwipe = Math.abs(horizontalDistance) > Math.abs(verticalDistance) * SWIPE_AXIS_BIAS;

    if (!isHorizontalSwipe || Math.abs(horizontalDistance) < SWIPE_THRESHOLD_PX) return;

    suppressCardClickUntilRef.current = Date.now() + 350;
    if (horizontalDistance < 0) {
      handleNext();
    } else {
      handlePrevious();
    }
  }, [handleNext, handlePrevious, isMobile]);

  const handleSwipeCancel = useCallback(() => {
    swipeStartRef.current = null;
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          if (currentQuestionIndex > 0) {
            handlePrevious();
          }
          break;
        case "ArrowRight":
        case " ": // Spacebar
          event.preventDefault();
          handleNext();
          break;
        case "ArrowUp":
        case "ArrowDown":
        case "Enter":
          event.preventDefault();
          if (currentQuestion?.more) {
            handleCardClick();
          }
          break;
        case "Escape":
          event.preventDefault();
          if (isCardFlipped) {
            setIsCardFlipped(false);
          } else {
            onExit();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentQuestion, currentQuestionIndex, handleCardClick, handleNext, handlePrevious, isCardFlipped, onExit]);

  return (
    <motion.div
      className="h-full w-full flex flex-col"
      initial={{ backgroundColor: "rgba(255, 255, 255, 0)" }}
      animate={{ backgroundColor }}
      transition={{ backgroundColor: { duration: 1.6, ease: "easeInOut" } }}
    >
      {/* Header - Minimal Navigation */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="flex justify-between items-center p-4 sm:p-8 relative z-10"
      >
        <button
          className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-xl sm:text-2xl transition-opacity duration-200 hover:opacity-65"
          style={{ color: uiColor }}
          onClick={onExit}
        >
          ←
        </button>

        <div
          className="text-xs sm:text-sm font-medium opacity-90"
          style={{ color: uiColor }}
        >
          {t("gameInterface.progressIndicator", {
            current: currentQuestionIndex + 1,
            total: questions.length,
          })}
        </div>
      </motion.header>

      {/* Main Card - Centered & Focused */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8 sm:py-16 relative z-10">
        <button
          type="button"
          aria-label={t("common.previous")}
          title={t("common.previous")}
          data-mobile-edge-nav="previous"
          className="absolute inset-y-0 left-0 z-20 flex w-12 touch-manipulation items-center justify-start pl-1 text-3xl opacity-25 transition-opacity active:opacity-70 disabled:pointer-events-none disabled:opacity-0 lg:hidden"
          style={{ color: uiColor }}
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <span aria-hidden="true">‹</span>
        </button>

        <button
          type="button"
          aria-label={t("common.next")}
          title={t("common.next")}
          data-mobile-edge-nav="next"
          className="absolute inset-y-0 right-0 z-20 flex w-12 touch-manipulation items-center justify-end pr-1 text-3xl opacity-25 transition-opacity active:opacity-70 lg:hidden"
          style={{ color: uiColor }}
          onClick={handleNext}
        >
          <span aria-hidden="true">›</span>
        </button>

        <div
          className="w-full max-w-4xl"
          data-mobile-swipe-surface
          onPointerCancel={handleSwipeCancel}
          onPointerDown={handleSwipeStart}
          onPointerMove={handleSwipeMove}
          onPointerUp={handleSwipeEnd}
          style={{ touchAction: isMobile ? "pan-y" : undefined }}
        >
          {/* Category Indicator - Minimal */}
          {currentCategory && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-4 sm:mb-8"
            >
              <div className="inline-flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                  className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full opacity-90"
                  style={{ backgroundColor: uiColor }}
                />
                <span
                  className="text-xs sm:text-sm font-medium opacity-90 uppercase tracking-wider"
                  style={{ color: uiColor }}
                >
                  {currentCategory.name}
                </span>
              </div>
            </motion.div>
          )}

          {/* Question Card */}
          <QuestionCard
            currentQuestionIndex={currentQuestionIndex}
            direction={direction}
            isCardFlipped={isCardFlipped}
            currentQuestion={currentQuestion}
            isWildcard={isWildMode}
            cardColor={cardColor}
            textColor={textColor}
            onCardClick={handleCardClick}
            readerRotation={isMobile && currentQuestionIndex % 2 === 1 ? 180 : 0}
            sessionEntryId={sessionEntryId}
          />

          {/* Category Description - Subtle */}
          {currentCategory && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center mt-4 sm:mt-8"
            >
              <p
                className="text-xs sm:text-sm opacity-70 font-light px-4"
                style={{ color: uiColor }}
              >
                {currentCategory.description}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Navigation - Animated Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex justify-between items-center p-4 sm:p-8 relative z-10"
      >
        <motion.button
          whileHover={{ scale: 1.08, x: -2, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1 sm:gap-2 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ color: uiColor }}
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <span className="text-lg sm:text-xl">←</span>
          <span className="text-sm sm:text-base">{t("common.previous")}</span>
        </motion.button>

        {/* Progress Indicator - Animated */}
        <div
          className="flex-1 mx-4 sm:mx-8 h-1 rounded-full overflow-hidden"
          style={{
            backgroundColor: isWildMode
              ? "rgba(174, 174, 174, 0.2)"
              : "rgba(255, 255, 255, 0.2)",
          }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: uiColor }}
            animate={{
              width: `${((currentQuestionIndex + 1) / questions.length) * 100
                }%`,
            }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
            }}
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.08, x: 2, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1 sm:gap-2 transition-colors duration-200"
          style={{ color: uiColor }}
          onClick={handleNext}
        >
          <span className="text-sm sm:text-base">{t("common.next")}</span>
          <span className="text-lg sm:text-xl">→</span>
        </motion.button>
      </motion.div>

      {/* Keyboard Hints - Subtle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 text-xs font-light text-center hidden sm:block"
        style={{ color: uiColor }}
      >
        <p>{t("navigation.keyboardHints")}</p>
      </motion.div>
    </motion.div>
  );
};

export default GamePlay;
