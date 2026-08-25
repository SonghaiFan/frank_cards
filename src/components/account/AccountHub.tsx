import { lazy, Suspense, useCallback, useState } from "react";
import { AnimatePresence } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../auth/AuthProvider";
import type { ConversationGame } from "../../types/ConversationGame";
import LanguageSwitcher from "../LanguageSwitcher";
import ThemeToggle from "../ThemeToggle";

const AuthDialog = lazy(() => import("./AuthDialog"));
const MyTopicsPanel = lazy(() => import("./MyTopicsPanel"));

interface PanelLoadingFallbackProps {
  alignEnd: boolean;
  onClose: () => void;
}

function PanelLoadingFallback({ alignEnd, onClose }: PanelLoadingFallbackProps) {
  const { t } = useTranslation();

  return (
    <div className={`account-overlay${alignEnd ? " account-overlay-align-end" : ""}`}>
      <section
        className={`account-sheet account-panel-loading${alignEnd ? " account-topics-sheet" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-busy="true"
        aria-label={t("account.loadingPanel")}
      >
        <button className="account-icon-button account-sheet-close" onClick={onClose} aria-label={t("account.close")}>×</button>
        <div className="account-panel-loading-mark" aria-hidden="true">
          <img src="/card-icon.svg" alt="" />
        </div>
        <p role="status" aria-live="polite">{t("account.loadingPanel")}</p>
      </section>
    </div>
  );
}

interface AccountHubProps {
  onUseTopic: (game: ConversationGame) => void;
}

export default function AccountHub({ onUseTopic }: AccountHubProps) {
  const { t } = useTranslation();
  const { status } = useAuth();
  const [openPanel, setOpenPanel] = useState<"auth" | "topics" | null>(null);
  const closePanel = useCallback(() => setOpenPanel(null), []);
  const authenticated = status === "authenticated";

  return (
    <>
      <nav className="account-toolbar" aria-label={t("account.toolbarLabel")}>
        <LanguageSwitcher className="account-language-button" />
        <ThemeToggle />
        {status === "loading" ? (
          <div className="account-toolbar-button account-toolbar-loading" role="status" aria-label={t("account.loadingAccount")}>
            <span className="account-toolbar-spinner" aria-hidden="true" />
            <span>{t("account.loadingAccount")}</span>
          </div>
        ) : (
          <button
            type="button"
            className="account-toolbar-button"
            onClick={() => setOpenPanel(authenticated ? "topics" : "auth")}
            aria-haspopup="dialog"
            aria-label={authenticated ? t("account.myTopics") : t("account.signIn")}
          >
            <FontAwesomeIcon icon={faUser} />
            <span>{authenticated ? t("account.myTopics") : t("account.signIn")}</span>
          </button>
        )}
      </nav>

      <Suspense fallback={<PanelLoadingFallback alignEnd={openPanel === "topics"} onClose={closePanel} />}>
        <AnimatePresence>
          {openPanel === "auth" ? <AuthDialog key="auth" onClose={closePanel} /> : null}
          {openPanel === "topics" ? <MyTopicsPanel key="topics" onClose={closePanel} onUseTopic={onUseTopic} /> : null}
        </AnimatePresence>
      </Suspense>
    </>
  );
}
