import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faEnvelope, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../auth/AuthProvider";

interface AuthDialogProps {
  onClose: () => void;
}

type AuthMode = "signIn" | "signUp" | "confirmation";

export default function AuthDialog({ onClose }: AuthDialogProps) {
  const { t } = useTranslation();
  const { clearError, error, isWorking, signInWithGoogle, signInWithPassword, signUpWithPassword, status } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const focusTimer = window.setTimeout(() => emailRef.current?.focus(), 80);
    return () => window.clearTimeout(focusTimer);
  }, [mode]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (status === "authenticated") onClose();
  }, [onClose, status]);

  const switchMode = (nextMode: Exclude<AuthMode, "confirmation">) => {
    clearError();
    setPassword("");
    setMode(nextMode);
  };

  const submitCredentials = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || password.length < 8) return;

    try {
      if (mode === "signUp") {
        const hasSession = await signUpWithPassword(email, password);
        if (!hasSession) setMode("confirmation");
      } else {
        await signInWithPassword(email, password);
        onClose();
      }
    } catch {
      // AuthProvider exposes the readable error beside the fields.
    }
  };

  const continueWithGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch {
      // AuthProvider exposes the readable error in the dialog.
    }
  };

  return (
    <motion.div
      className="account-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-auth-title"
        className="account-sheet"
        initial={{ opacity: 0, y: 20, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.99 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        <button className="account-icon-button account-sheet-close" onClick={onClose} aria-label={t("account.close")}>
          <FontAwesomeIcon icon={faXmark} />
        </button>

        {status === "disabled" ? (
          <div className="account-sheet-copy">
            <p className="account-kicker">FrankCards</p>
            <h2 id="account-auth-title">{t("account.notConnectedTitle")}</h2>
            <p>{t("account.notConnectedBody")}</p>
            <button className="account-primary-button" type="button" onClick={onClose}>{t("account.keepExploring")}</button>
          </div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            {mode === "confirmation" ? (
              <motion.div
                key="confirmation"
                className="account-sheet-copy account-confirmation"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <span className="account-confirmation-icon" aria-hidden="true"><FontAwesomeIcon icon={faEnvelope} /></span>
                <h2 id="account-auth-title">{t("account.confirmEmailTitle")}</h2>
                <p>{t("account.confirmEmailBody", { email })}</p>
                <button className="account-primary-button" type="button" onClick={() => switchMode("signIn")}>
                  {t("account.backToSignIn")}
                </button>
              </motion.div>
            ) : (
              <motion.form
                key={mode}
                className="account-sheet-copy"
                onSubmit={submitCredentials}
                initial={{ opacity: 0, x: mode === "signUp" ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === "signUp" ? 10 : -10 }}
              >
                {mode === "signUp" ? (
                  <button className="account-back-button" type="button" onClick={() => switchMode("signIn")}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span>{t("common.back")}</span>
                  </button>
                ) : null}

                <p className="account-kicker">FrankCards</p>
                <h2 id="account-auth-title">{t(mode === "signUp" ? "account.createAccountTitle" : "account.signInTitle")}</h2>
                <p>{t(mode === "signUp" ? "account.createAccountBody" : "account.signInBody")}</p>

                <button className="account-google-button" type="button" onClick={() => void continueWithGoogle()} disabled={isWorking}>
                  <span className="account-google-mark" aria-hidden="true">G</span>
                  <span>{t("account.continueWithGoogle")}</span>
                </button>

                <div className="account-auth-divider"><span>{t("account.orUseEmail")}</span></div>

                <label className="account-field">
                  <span>{t("account.emailLabel")}</span>
                  <input
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (error) clearError();
                    }}
                    autoComplete="email"
                    required
                    placeholder={t("account.emailPlaceholder")}
                  />
                </label>

                <label className="account-field">
                  <span>{t("account.passwordLabel")}</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (error) clearError();
                    }}
                    autoComplete={mode === "signUp" ? "new-password" : "current-password"}
                    minLength={8}
                    required
                    placeholder={t("account.passwordPlaceholder")}
                  />
                </label>

                {mode === "signUp" ? <p className="account-form-note">{t("account.passwordHint")}</p> : null}
                {error ? <p className="account-field-error" role="alert">{error}</p> : null}

                <button className="account-primary-button" type="submit" disabled={isWorking || !email.trim() || password.length < 8}>
                  {isWorking
                    ? t(mode === "signUp" ? "account.creatingAccount" : "account.signingIn")
                    : t(mode === "signUp" ? "account.createAccount" : "account.signIn")}
                </button>

                {mode === "signIn" ? (
                  <button className="account-text-button" type="button" onClick={() => switchMode("signUp")} disabled={isWorking}>
                    {t("account.needAccount")}
                  </button>
                ) : null}
              </motion.form>
            )}
          </AnimatePresence>
        )}
      </motion.section>
    </motion.div>
  );
}
