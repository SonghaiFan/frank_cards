import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";


interface GameIntroPanelProps {
  uiColor: string;
  onSwitchToCustom: () => void;
  handleClick: () => void;
}

const GameIntroPanel: React.FC<GameIntroPanelProps> = ({
  uiColor,
  onSwitchToCustom,
  handleClick
}) => {
  const { t } = useTranslation();

  return (
    <div className="relative flex h-auto w-full min-w-0 max-w-full flex-col justify-center text-center lg:ml-auto lg:h-[34rem] lg:w-full lg:text-right xl:w-[34rem]">
      <div className="flex items-center justify-center lg:justify-end mb-8 sm:mb-12">
        <motion.h1
          className="min-w-0 max-w-full cursor-pointer whitespace-normal break-words [overflow-wrap:anywhere] text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-black tracking-tight leading-none transition-colors duration-700"
          style={{ color: uiColor }}
          onClick={handleClick}
          whileTap={{ scale: 0.98 }}
          aria-label="FrankCards"
        >
          <span className="sr-only">Frank</span>
          <span aria-hidden="true" className="frank-signature" />
          <span>Cards</span>
        </motion.h1>
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
