import React from "react";
import { motion } from "motion/react";
import { ConversationGame } from "../types/ConversationGame";
import GameInfoPanel from "./GameInfoPanel";
import AppBackButton from "./AppBackButton";

interface GameLandingProps {
  game: ConversationGame;
  onStart: () => void;
  onExit: () => void;
}

const GameLanding: React.FC<GameLandingProps> = ({ game, onStart, onExit }) => {
  return (
    <div className="theme-canvas h-full w-full overflow-y-auto">
      <div className="min-h-full flex flex-col items-center justify-center px-4 sm:px-8 py-8 sm:py-16">
        <AppBackButton onClick={onExit} />

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
