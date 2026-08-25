import React from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { ConversationGame } from "../types/ConversationGame";
import Button from "./Button";

interface GameEndingProps {
  game: ConversationGame;
  onRestart: () => void;
  onExit: () => void;
}

const GameEnding: React.FC<GameEndingProps> = ({ game, onRestart, onExit }) => {
  const { t } = useTranslation();
  const endScreen = game.ui.endScreen;

  return (
    <div className="theme-canvas h-full w-full flex flex-col items-center justify-center px-4 sm:px-8 py-8 sm:py-16">
      <div className="text-center max-w-2xl">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="theme-text-primary text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 tracking-tight"
        >
          {endScreen.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="theme-text-secondary text-lg sm:text-xl text-intimate font-light mb-8 sm:mb-12 px-4"
        >
          {endScreen.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center px-4"
        >
          <Button variant="primary" onClick={onRestart}>
            {endScreen.restartButton}
          </Button>

          <Button variant="secondary" onClick={onExit}>
            {t("common.exit")}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default GameEnding;
