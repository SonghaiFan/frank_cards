import React from "react";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLanguage } from "@fortawesome/free-solid-svg-icons";

interface LanguageSwitcherProps {
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = "",
}) => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLanguage = i18n.language === "en" ? "zh" : "en";
    i18n.changeLanguage(newLanguage);
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`account-toolbar-icon-button ${className}`}
      aria-label={`Switch to ${i18n.language === "en" ? "中文" : "English"}`}
      title={`Switch to ${i18n.language === "en" ? "中文" : "English"}`}
    >
      <FontAwesomeIcon icon={faLanguage} size="xl" />
    </button>
  );
};

export default LanguageSwitcher;
