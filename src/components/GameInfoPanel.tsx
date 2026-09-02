import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { ConversationGame } from "../types/ConversationGame";
import Button from "./Button";
import ContourText from "./ContourText";

interface GameInfoPanelProps {
  uiColor?: string;
  game: ConversationGame;
  onStart?: () => void;
  showStartButton?: boolean;
}

const GameInfoPanel: React.FC<GameInfoPanelProps> = ({ 
  uiColor,
  game, 
  onStart, 
  showStartButton = true 
}) => {
  const reducedMotion = useReducedMotion();
  const titleLength = Array.from(game.ui.startScreen.title.trim()).length;
  const hasLongTitle = titleLength > 18;
  const languageLayoutTransition = {
    duration: reducedMotion ? 0 : 0.58,
    ease: [0.16, 1, 0.3, 1] as const,
  };

  return (
    <motion.div
      layout
      data-game-info-panel
      className="flex h-[40dvh] min-h-72 max-h-[21rem] w-full min-w-0 max-w-full flex-col text-center lg:ml-auto lg:h-[34rem] lg:min-h-0 lg:max-h-none lg:w-full lg:text-right xl:w-[34rem]"
      transition={{ layout: languageLayoutTransition }}
    >
      <motion.div layout data-game-info-scroll className="min-h-0 flex-1 overflow-y-auto no-scrollbar py-2" transition={{ layout: languageLayoutTransition }}>
        <div className="flex min-h-full min-w-0 flex-col justify-center">
          <motion.h1
            layout="position"
            className={`theme-text-primary mb-6 max-w-full whitespace-normal break-words text-3xl font-black leading-tight tracking-tight transition-colors duration-700 [text-wrap:balance] sm:mb-8 sm:text-4xl md:text-5xl lg:ml-auto lg:max-w-[17rem] xl:max-w-[19rem] xl:text-5xl ${hasLongTitle ? "2xl:text-5xl" : "2xl:text-6xl"}`}
            style={uiColor ? { color: uiColor } : undefined}
            transition={{ layout: languageLayoutTransition }}
          >
            {game.ui.startScreen.title}
          </motion.h1>

          <motion.div
            layout="position"
            className="mx-auto w-full max-w-[24rem] lg:ml-auto lg:mr-0 lg:max-w-[22rem]"
            transition={{ layout: languageLayoutTransition }}
          >
            <ContourText
              color={uiColor}
              paragraphs={game.ui.startScreen.description}
              className="theme-text-secondary text-base font-light leading-relaxed transition-colors duration-700 sm:text-lg md:text-xl"
            />
          </motion.div>
        </div>

      </motion.div>

      {showStartButton && onStart && (
        <motion.div layout="position" className="flex shrink-0 justify-center pt-6 lg:justify-end lg:pt-8" transition={{ layout: languageLayoutTransition }}>
          <Button
            className="font-semibold"
            variant="primary"
            onClick={onStart}
          >
            {game.ui.startScreen.startButton}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default GameInfoPanel;
