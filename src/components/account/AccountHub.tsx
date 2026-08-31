import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldHalved, faUser } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../auth/AuthProvider";
import type { ConversationGame } from "../../types/ConversationGame";
import LanguageSwitcher from "../LanguageSwitcher";
import ThemeToggle from "../ThemeToggle";

const AuthDialog = lazy(() => import("./AuthDialog"));
const MyTopicsPanel = lazy(() => import("./MyTopicsPanel"));
const AdminReviewPanel = lazy(() => import("./AdminReviewPanel"));

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
  authDialogRequest: { id: number; mode: "signIn" | "signUp" };
  onTopicsChanged: () => void;
  onUseTopic: (game: ConversationGame) => void;
}

export default function AccountHub({ authDialogRequest, onTopicsChanged, onUseTopic }: AccountHubProps) {
  const { t } = useTranslation();
  const { isAdmin, isPasswordRecovery, profile, status } = useAuth();
  const [openPanel, setOpenPanel] = useState<"admin" | "auth" | "topics" | null>(null);
  const [authEntryMode, setAuthEntryMode] = useState<"signIn" | "signUp">("signIn");
  const closePanel = useCallback(() => setOpenPanel(null), []);
  const authenticated = status === "authenticated" && !isPasswordRecovery;

  useEffect(() => {
    if (isPasswordRecovery) setOpenPanel("auth");
  }, [isPasswordRecovery]);

  useEffect(() => {
    if (authDialogRequest.id <= 0 || status === "authenticated") return;
    setAuthEntryMode(authDialogRequest.mode);
    setOpenPanel("auth");
  }, [authDialogRequest.id, authDialogRequest.mode, status]);

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
          <>
            {authenticated && isAdmin ? (
              <button
                type="button"
                className="account-toolbar-button"
                onClick={() => setOpenPanel("admin")}
                aria-haspopup="dialog"
                aria-label={t("admin.reviewTitle")}
              >
                <FontAwesomeIcon icon={faShieldHalved} />
                <span>{t("admin.toolbar")}</span>
              </button>
            ) : null}
            <button
              type="button"
              className="account-toolbar-button"
              onClick={() => {
                if (!authenticated) setAuthEntryMode("signIn");
                setOpenPanel(authenticated ? "topics" : "auth");
              }}
              aria-haspopup="dialog"
              aria-label={authenticated ? t("account.myTopics") : t("account.signIn")}
            >
              {authenticated && profile?.avatar_url ? (
                <img className="account-toolbar-avatar" src={profile.avatar_url} alt="" />
              ) : (
                <FontAwesomeIcon icon={faUser} />
              )}
              <span>{authenticated ? profile?.display_name || t("account.myTopics") : t("account.guestMode")}</span>
            </button>
          </>
        )}
      </nav>

      <Suspense fallback={<PanelLoadingFallback alignEnd={openPanel === "topics" || openPanel === "admin"} onClose={closePanel} />}>
        <AnimatePresence>
          {openPanel === "auth" ? <AuthDialog key="auth" initialMode={authEntryMode} onClose={closePanel} /> : null}
          {openPanel === "topics" ? <MyTopicsPanel key="topics" onClose={closePanel} onTopicsChanged={onTopicsChanged} onUseTopic={onUseTopic} /> : null}
          {openPanel === "admin" ? <AdminReviewPanel key="admin" onClose={closePanel} onTopicsChanged={onTopicsChanged} onUseTopic={onUseTopic} /> : null}
        </AnimatePresence>
      </Suspense>
    </>
  );
}
