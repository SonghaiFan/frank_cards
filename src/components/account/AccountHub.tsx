import { lazy, Suspense, useCallback, useState } from "react";
import { AnimatePresence } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../auth/AuthProvider";
import LanguageSwitcher from "../LanguageSwitcher";

const AuthDialog = lazy(() => import("./AuthDialog"));
const MyTopicsPanel = lazy(() => import("./MyTopicsPanel"));

export default function AccountHub() {
  const { t } = useTranslation();
  const { status } = useAuth();
  const [openPanel, setOpenPanel] = useState<"auth" | "topics" | null>(null);
  const closePanel = useCallback(() => setOpenPanel(null), []);
  const authenticated = status === "authenticated";

  return (
    <>
      <nav className="account-toolbar" aria-label={t("account.toolbarLabel")}>
        <LanguageSwitcher className="account-language-button" />
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
      </nav>

      <Suspense fallback={null}>
        <AnimatePresence>
          {openPanel === "auth" ? <AuthDialog key="auth" onClose={closePanel} /> : null}
          {openPanel === "topics" ? <MyTopicsPanel key="topics" onClose={closePanel} /> : null}
        </AnimatePresence>
      </Suspense>
    </>
  );
}
