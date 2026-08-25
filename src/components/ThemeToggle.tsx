import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { setAppTheme, useAppTheme } from "../hooks/useAppTheme";

export default function ThemeToggle() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";
  const label = nextTheme === "dark" ? t("account.switchToDark") : t("account.switchToLight");

  const toggleTheme = () => {
    setAppTheme(nextTheme);
  };

  return (
    <button
      type="button"
      className="account-toolbar-icon-button account-theme-button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      <FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} />
    </button>
  );
}
