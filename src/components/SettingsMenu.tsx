import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCircleHalfStroke, faGear, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { setAlternateReaderSide, useAlternateReaderSide } from "../hooks/useAppPreferences";
import { setAppTheme, useAppThemePreference } from "../hooks/useAppTheme";

interface SettingsMenuProps {
  isLanguageSwitching: boolean;
  onChangeLanguage: (language: "en" | "zh") => Promise<void>;
}

export default function SettingsMenu({ isLanguageSwitching, onChangeLanguage }: SettingsMenuProps) {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const themePreference = useAppThemePreference();
  const alternateReaderSide = useAlternateReaderSide();
  const language = i18n.resolvedLanguage?.startsWith("zh") ? "zh" : "en";

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="app-settings" ref={containerRef}>
      <button
        type="button"
        className={`account-toolbar-icon-button app-settings-trigger${isOpen ? " is-active" : ""}`}
        aria-label={t("settings.open")}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen((open) => !open)}
        title={t("settings.open")}
      >
        <FontAwesomeIcon icon={faGear} />
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.section
            className="app-settings-popover"
            role="dialog"
            aria-label={t("settings.title")}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.985 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <header className="app-settings-header">
              <div>
                <p>{t("settings.eyebrow")}</p>
                <h2>{t("settings.title")}</h2>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} aria-label={t("account.close")}>×</button>
            </header>

            <div className="app-settings-group">
              <div className="app-settings-copy">
                <strong>{t("settings.language")}</strong>
                <small>{isLanguageSwitching ? t("account.switchingLanguage") : t("settings.languageHint")}</small>
              </div>
              <div className="app-settings-options" aria-label={t("settings.language")}>
                {(["en", "zh"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={language === option ? "is-selected" : ""}
                    disabled={isLanguageSwitching}
                    aria-pressed={language === option}
                    onClick={() => void onChangeLanguage(option)}
                  >
                    <span>{option === "en" ? "English" : "中文"}</span>
                    {language === option ? <FontAwesomeIcon icon={faCheck} /> : null}
                  </button>
                ))}
              </div>
            </div>

            <div className="app-settings-group">
              <div className="app-settings-copy">
                <strong>{t("settings.appearance")}</strong>
                <small>{t("settings.appearanceHint")}</small>
              </div>
              <div className="app-settings-options app-settings-theme-options" aria-label={t("settings.appearance")}>
                {([
                  ["system", faCircleHalfStroke],
                  ["light", faSun],
                  ["dark", faMoon],
                ] as const).map(([option, icon]) => (
                  <button
                    key={option}
                    type="button"
                    className={themePreference === option ? "is-selected" : ""}
                    aria-pressed={themePreference === option}
                    onClick={() => setAppTheme(option)}
                  >
                    <FontAwesomeIcon icon={icon} />
                    <span>{t(`settings.${option}`)}</span>
                  </button>
                ))}
              </div>
            </div>

            <label className="app-settings-switch-row">
              <span className="app-settings-copy">
                <strong>{t("settings.alternateReaderSide")}</strong>
                <small>{t("settings.alternateReaderSideHint")}</small>
              </span>
              <input
                type="checkbox"
                checked={alternateReaderSide}
                onChange={(event) => setAlternateReaderSide(event.target.checked)}
              />
              <span className="app-settings-switch" aria-hidden="true">
                <span />
              </span>
            </label>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
