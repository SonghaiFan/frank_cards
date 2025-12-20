import React from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

interface GameIntroPanelProps {
  onSwitchToCustom: () => void;
}

const GameIntroPanel: React.FC<GameIntroPanelProps> = ({ onSwitchToCustom }) => {
  const { t } = useTranslation();

  return (
    <div className="text-center max-w-3xl relative">
      <div className="absolute -top-12 right-0 md:top-0 md:right-0">
         <LanguageSwitcher />
      </div>

      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-black dark:text-white mb-6 sm:mb-8 tracking-tight leading-tight">
        {t("quickMode.title")} <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
          {t("quickMode.subtitle")}
        </span>
      </h1>
      <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 text-intimate font-light mb-8 sm:mb-12 leading-relaxed">
        {t("quickMode.description")}
      </p>
      <div className="flex flex-col items-center gap-4">
        <button
          className="px-8 py-3 bg-black text-white rounded-full font-bold hover:scale-105 transition-transform shadow-lg"
          onClick={onSwitchToCustom}
        >
          {t("quickMode.switchToCustom")}
        </button>
      </div>
    </div>
  );
};

export default GameIntroPanel;
