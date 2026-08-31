import React from "react";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLanguage } from "@fortawesome/free-solid-svg-icons";

interface LanguageSwitcherProps {
  className?: string;
  isSwitching?: boolean;
  onChangeLanguage: (language: "en" | "zh") => Promise<void>;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = "",
  isSwitching = false,
  onChangeLanguage,
}) => {
  const { i18n, t } = useTranslation();

  const currentLanguage = i18n.resolvedLanguage?.startsWith("zh") ? "zh" : "en";
  const nextLanguage = currentLanguage === "en" ? "zh" : "en";
  const nextLanguageLabel = nextLanguage === "zh" ? "中文" : "English";
  const accessibleLabel = isSwitching
    ? t("account.switchingLanguage")
    : t("account.switchToLanguage", { language: nextLanguageLabel });

  const toggleLanguage = () => {
    void onChangeLanguage(nextLanguage);
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`account-toolbar-icon-button language-switcher ${isSwitching ? "is-switching" : ""} ${className}`}
      aria-label={accessibleLabel}
      aria-busy={isSwitching}
      disabled={isSwitching}
      title={accessibleLabel}
    >
      <FontAwesomeIcon icon={faLanguage} size="xl" />
    </button>
  );
};

export default LanguageSwitcher;
