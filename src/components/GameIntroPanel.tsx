import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";


interface GameIntroPanelProps {
  uiColor: string;
  onSwitchToCustom: () => void;
  handleClick: () => void;
  clickProgress: number;
}

const GameIntroPanel: React.FC<GameIntroPanelProps> = ({
  uiColor,
  onSwitchToCustom,
  handleClick,
  clickProgress
}) => {
  const { t } = useTranslation();

  return (
    <div className="relative flex h-auto w-full min-w-0 max-w-full flex-col justify-center text-center lg:ml-auto lg:h-[34rem] lg:w-full lg:text-right xl:w-[34rem]">
      <div className="flex items-center justify-center lg:justify-end gap-3 sm:gap-5 mb-8 sm:mb-12">
        {/* Icon */}
        <motion.div
          className="relative cursor-pointer"
          onClick={handleClick}
          whileTap={{ scale: 0.95 }}
        >
          <motion.img
            src="/icon.png"
            alt="FrankCards Logo"
            className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 xl:w-24 xl:h-24"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
          {/* Subtle progress indicator */}
          {clickProgress > 0 && clickProgress < 1 && (
            <motion.div
              className="theme-selection-ring absolute inset-0 rounded-full border-2"
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
        <h1 className="min-w-0 max-w-full whitespace-normal break-words [overflow-wrap:anywhere] text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-black tracking-tight leading-none transition-colors duration-700" style={{ color: uiColor }}>
          <span className="sr-only">Frank</span>
          <span aria-hidden="true" className="frank-signature" />
          <span>Cards</span>
        </h1>
      </div>
      <p className="ml-auto max-w-full whitespace-normal break-words [overflow-wrap:anywhere] text-base sm:text-lg md:text-xl text-intimate font-light mb-8 sm:mb-12 leading-relaxed transition-colors duration-700 lg:max-w-[44ch]" style={{ color: uiColor }}>
        {t("quickMode.description")}
      </p>

      <div className="flex flex-col items-center lg:items-end gap-4">
        <button
          className="material-control theme-primary-control px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform"
          onClick={onSwitchToCustom}
        >
          {t("quickMode.switchToCustom")}
        </button>
      </div>
    </div>
  );
};


export default GameIntroPanel;
