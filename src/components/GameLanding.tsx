import React from "react";
import { motion } from "motion/react";
import { ConversationGame } from "../types/ConversationGame";
import GameInfoPanel from "./GameInfoPanel";

interface GameLandingProps {
  game: ConversationGame;
  onStart: () => void;
  onExit: () => void;
}

const GameLanding: React.FC<GameLandingProps> = ({ game, onStart, onExit }) => {
  return (
    <div className="h-full w-full bg-white dark:bg-black overflow-y-auto">
      <div className="min-h-full flex flex-col items-center justify-center px-4 sm:px-8 py-8 sm:py-16">
        {/* Exit Button - Minimal */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute top-4 left-4 sm:top-8 sm:left-8 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-xl sm:text-2xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
          onClick={onExit}
        >
          ←
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-center max-w-3xl"
        >
          <GameInfoPanel game={game} onStart={onStart} />
        </motion.div>
      </div>
    </div>
  );
};

export default GameLanding;
