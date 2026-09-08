import React from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

interface AppBackButtonProps {
  onClick: () => void;
  label?: string;
}

const AppBackButton: React.FC<AppBackButtonProps> = ({ onClick, label }) => {
  const { t } = useTranslation();
  const accessibleLabel = label ?? t("common.back");

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      aria-label={accessibleLabel}
      className="app-back-button theme-interactive-text"
      onClick={onClick}
      title={accessibleLabel}
      type="button"
      whileTap={{ scale: 0.96 }}
    >
      ←
    </motion.button>
  );
};

export default AppBackButton;
