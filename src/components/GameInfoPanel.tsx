import React from "react";
import { motion } from "motion/react";
import { ConversationGame } from "../types/ConversationGame";
import Button from "./Button";

interface GameInfoPanelProps {
  game: ConversationGame;
  onStart?: () => void;
  showStartButton?: boolean;
}

const GameInfoPanel: React.FC<GameInfoPanelProps> = ({ 
  game, 
  onStart, 
  showStartButton = true 
}) => {
  return (
    <div className="text-center max-w-3xl">
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-6 sm:mb-8 tracking-tight leading-tight">
        {game.ui.startScreen.title}
      </h1>

      {game.ui.startScreen.description.map(
        (desc: string, index: number) => (
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.1 }}
            className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 text-intimate font-light mb-4 sm:mb-6 leading-relaxed"
          >
            {desc}
          </motion.p>
        )
      )}

      {showStartButton && onStart && (
        <div className="flex justify-center">
          <Button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 sm:mt-12 font-semibold"
            variant="primary"
            onClick={onStart}
          >
            {game.ui.startScreen.startButton}
          </Button>
        </div>
      )}
    </div>
  );
};

export default GameInfoPanel;
