import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import LanguageSwitcher from "./LanguageSwitcher";


interface GameIntroPanelProps {
  onSwitchToCustom: () => void;
  handleClick: () => void;
  clickProgress: number;
}

const GameIntroPanel: React.FC<GameIntroPanelProps> = ({ 
  onSwitchToCustom, 
  handleClick, 
  clickProgress 
}) => {
  const { t } = useTranslation();

  return (
    <div className="text-center max-w-3xl relative">
      <div className="absolute -top-12 right-0 md:top-0 md:right-0">
         <LanguageSwitcher />
      </div>

      <div className="flex items-center justify-center gap-3 sm:gap-5 mb-8 sm:mb-12">
        {/* Icon */}
        <motion.div
            className="relative cursor-pointer"
            onClick={handleClick}
            whileTap={{ scale: 0.95 }}
          >
          <motion.img
            src="/icon.png"
            alt="CueCards Logo"
            className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
          {/* Subtle progress indicator */}
            {clickProgress > 0 && clickProgress < 1 && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-black dark:border-white"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: [0, 0.2, 0],
                  scale: [0.8, 1.1, 1.2],
                }}
                transition={{
                  duration: 0.5,
                  times: [0, 0.5, 1],
                  repeat: 0,
                }}
              />
            )}
        </motion.div>
        {/* Text */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-black dark:text-white tracking-tight leading-none">
          CueCards
        </h1>
      </div>
      <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 text-intimate font-light mb-8 sm:mb-12 leading-relaxed">
        {t("quickMode.description")}
      </p>
        
      <div className="flex flex-col items-center gap-4">
        <button
          className="px-8 py-3 bg-black text-white rounded-full font-bold hover:scale-105 transition-transform shadow-lg border border-2 border-gray-200 dark:border-gray-700"
          onClick={onSwitchToCustom}
        >
          {t("quickMode.switchToCustom")}
        </button>
      </div>
    </div>
  );
};


export default GameIntroPanel;
