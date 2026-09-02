import React from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../auth/AuthProvider";


interface GameIntroPanelProps {
  uiColor: string;
  onSwitchToCustom: () => void;
  handleClick: () => void;
}

const languageLayoutEase = [0.16, 1, 0.3, 1] as const;

const GameIntroPanel: React.FC<GameIntroPanelProps> = ({
  uiColor,
  onSwitchToCustom,
  handleClick
}) => {
  const { t } = useTranslation();
  const { status } = useAuth();
  const reducedMotion = useReducedMotion();
  const authenticated = status === "authenticated";
  const languageLayoutTransition = {
    duration: reducedMotion ? 0 : 0.58,
    ease: languageLayoutEase,
  };

  return (
    <motion.div
      layout
      className="game-intro-panel relative flex h-auto w-full min-w-0 max-w-full flex-col justify-center text-center lg:ml-auto lg:h-[34rem] lg:w-full lg:text-right xl:w-[34rem]"
      transition={{ layout: languageLayoutTransition }}
    >
      <motion.div
        layout="position"
        className="game-intro-brand flex items-center justify-center lg:justify-end mb-8 sm:mb-12"
        transition={{ layout: languageLayoutTransition }}
      >
        <motion.h1
          layoutId="frankcards-brand"
          className="min-w-0 max-w-full cursor-pointer whitespace-normal break-words text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-black tracking-tight leading-none transition-colors duration-700"
          style={{ color: uiColor }}
          onClick={handleClick}
          whileTap={{ scale: 0.98 }}
          transition={{ layout: { duration: reducedMotion ? 0 : 0.82, ease: languageLayoutEase } }}
          aria-label="FrankCards"
        >
          <span className="sr-only">Frank</span>
          <span aria-hidden="true" className="frank-signature" />
          <span>Cards</span>
        </motion.h1>
      </motion.div>
      <motion.div
        layout="position"
        className="game-intro-description-group"
        transition={{ layout: languageLayoutTransition }}
      >
        <p
          className="game-intro-description ml-auto max-w-full whitespace-normal break-words text-base sm:text-lg md:text-xl text-intimate font-light mb-8 sm:mb-12 leading-relaxed transition-colors duration-700 lg:max-w-[44ch]"
          style={{ color: uiColor }}
        >
          {t("quickMode.description")}
        </p>
        <motion.span
          aria-hidden="true"
          className="game-intro-scroll-icon"
          animate={reducedMotion ? undefined : { y: [0, 5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ color: uiColor }}
        >
          <FontAwesomeIcon icon={faChevronDown} />
        </motion.span>
      </motion.div>

      <motion.div
        layout="position"
        className="game-intro-actions flex flex-col items-center lg:items-end gap-4"
        transition={{ layout: languageLayoutTransition }}
      >
        <motion.button
          layout
          className="material-control theme-primary-control px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform"
          onClick={onSwitchToCustom}
          disabled={status === "loading"}
          transition={{ layout: languageLayoutTransition }}
        >
          {t(authenticated ? "quickMode.switchToCustom" : "account.joinFrankCards")}
        </motion.button>
        <motion.p
          layout="position"
          className="custom-mode-unlock-hint"
          style={{ color: uiColor }}
          transition={{ layout: languageLayoutTransition }}
        >
          {t(authenticated ? "quickMode.customModeHint" : "account.joinFrankCardsHint")}
        </motion.p>
      </motion.div>
    </motion.div>
  );
};


export default GameIntroPanel;
