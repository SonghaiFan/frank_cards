import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCheck, faEnvelope, faLock, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../auth/AuthProvider";

interface AuthDialogProps {
  onClose: () => void;
}

type AuthMode =
  | "signIn"
  | "signUp"
  | "confirmation"
  | "forgotPassword"
  | "resetSent"
  | "passwordRecovery"
  | "passwordUpdated";

type EditableAuthMode = "signIn" | "signUp" | "forgotPassword";

export default function AuthDialog({ onClose }: AuthDialogProps) {
  const { t } = useTranslation();
  const {
    clearError,
    error,
    finishPasswordRecovery,
    isPasswordRecovery,
    isWorking,
    requestPasswordReset,
    resendSignupConfirmation,
    signInWithPassword,
    signOut,
    signUpWithPassword,
    status,
    updatePassword,
  } = useAuth();
  const [mode, setMode] = useState<AuthMode>(() => (
    isPasswordRecovery ? "passwordRecovery" : "signIn"
  ));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmedPassword, setConfirmedPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const emailRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);

  const closeDialog = useCallback(async () => {
    if (isPasswordRecovery) {
      try {
        await signOut();
      } finally {
        onClose();
      }
      return;
    }
    onClose();
  }, [isPasswordRecovery, onClose, signOut]);

  useEffect(() => {
    const focusTimer = window.setTimeout(() => {
      if (mode === "passwordRecovery") {
        newPasswordRef.current?.focus();
      } else if (mode === "signIn" || mode === "signUp" || mode === "forgotPassword") {
        emailRef.current?.focus();
      }
    }, 80);
    return () => window.clearTimeout(focusTimer);
  }, [mode]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") void closeDialog();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [closeDialog]);

  useEffect(() => {
    if (!isPasswordRecovery) return;
    clearError();
    setFormError(null);
    setMode("passwordRecovery");
  }, [clearError, isPasswordRecovery]);

  useEffect(() => {
    if (status === "authenticated" && !isPasswordRecovery && mode !== "passwordUpdated") onClose();
  }, [isPasswordRecovery, mode, onClose, status]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => {
      setResendCooldown((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const clearMessages = () => {
    if (error) clearError();
    setFormError(null);
    setConfirmationMessage(null);
  };

  const switchMode = (nextMode: EditableAuthMode) => {
    clearMessages();
    setPassword("");
    setMode(nextMode);
  };

  const submitCredentials = async (event: FormEvent) => {
    event.preventDefault();
    if ((mode !== "signIn" && mode !== "signUp") || !email.trim() || password.length < 8) return;

    try {
      if (mode === "signUp") {
        const hasSession = await signUpWithPassword(email, password);
        if (!hasSession) {
          setResendCooldown(60);
          setMode("confirmation");
        }
      } else {
        await signInWithPassword(email, password);
        onClose();
      }
    } catch {
      // AuthProvider exposes the readable error beside the fields.
    }
  };

  const resendConfirmation = async () => {
    if (!email.trim() || resendCooldown > 0) return;
    clearMessages();
    try {
      await resendSignupConfirmation(email);
      setConfirmationMessage(t("account.confirmationResent"));
      setResendCooldown(60);
    } catch {
      // AuthProvider exposes the readable error in the confirmation view.
    }
  };

  const submitPasswordReset = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    clearMessages();
    try {
      await requestPasswordReset(email);
      setMode("resetSent");
    } catch {
      // AuthProvider exposes the readable error beside the email field.
    }
  };

  const submitNewPassword = async (event: FormEvent) => {
    event.preventDefault();
    clearMessages();
    if (newPassword.length < 8) return;
    if (newPassword !== confirmedPassword) {
      setFormError(t("account.passwordMismatch"));
      return;
    }

    try {
      await updatePassword(newPassword);
      setMode("passwordUpdated");
    } catch {
      // AuthProvider exposes the readable error beside the password fields.
    }
  };

  const finishRecovery = () => {
    finishPasswordRecovery();
    onClose();
  };

  const renderMessage = () => (
    <>
      {confirmationMessage ? <p className="account-field-success" role="status">{confirmationMessage}</p> : null}
      {error || formError ? <p className="account-field-error" role="alert">{error ?? formError}</p> : null}
    </>
  );

  return (
    <motion.div
      className="account-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) void closeDialog();
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
        <button className="account-icon-button account-sheet-close" onClick={() => void closeDialog()} aria-label={t("account.close")}>
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
                {renderMessage()}
                <button
                  className="account-primary-button"
                  type="button"
                  onClick={() => void resendConfirmation()}
                  disabled={isWorking || resendCooldown > 0}
                >
                  {isWorking
                    ? t("account.resendingConfirmation")
                    : resendCooldown > 0
                      ? t("account.resendIn", { seconds: resendCooldown })
                      : t("account.resendConfirmation")}
                </button>
                <button className="account-text-button" type="button" onClick={() => switchMode("signIn")}>
                  {t("account.backToSignIn")}
                </button>
              </motion.div>
            ) : mode === "resetSent" ? (
              <motion.div
                key="reset-sent"
                className="account-sheet-copy account-confirmation"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <span className="account-confirmation-icon" aria-hidden="true"><FontAwesomeIcon icon={faEnvelope} /></span>
                <h2 id="account-auth-title">{t("account.resetEmailTitle")}</h2>
                <p>{t("account.resetEmailBody", { email })}</p>
                <button className="account-primary-button" type="button" onClick={() => switchMode("signIn")}>
                  {t("account.backToSignIn")}
                </button>
              </motion.div>
            ) : mode === "passwordRecovery" ? (
              <motion.form
                key="password-recovery"
                className="account-sheet-copy"
                onSubmit={submitNewPassword}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <span className="account-confirmation-icon" aria-hidden="true"><FontAwesomeIcon icon={faLock} /></span>
                <h2 id="account-auth-title">{t("account.newPasswordTitle")}</h2>
                <p>{t("account.newPasswordBody")}</p>
                <label className="account-field">
                  <span>{t("account.newPasswordLabel")}</span>
                  <input
                    ref={newPasswordRef}
                    type="password"
                    value={newPassword}
                    onChange={(event) => {
                      setNewPassword(event.target.value);
                      clearMessages();
                    }}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    placeholder={t("account.passwordPlaceholder")}
                  />
                </label>
                <label className="account-field">
                  <span>{t("account.confirmPasswordLabel")}</span>
                  <input
                    type="password"
                    value={confirmedPassword}
                    onChange={(event) => {
                      setConfirmedPassword(event.target.value);
                      clearMessages();
                    }}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    placeholder={t("account.passwordPlaceholder")}
                  />
                </label>
                <p className="account-form-note">{t("account.passwordHint")}</p>
                {renderMessage()}
                <button
                  className="account-primary-button"
                  type="submit"
                  disabled={isWorking || newPassword.length < 8 || confirmedPassword.length < 8}
                >
                  {isWorking ? t("account.updatingPassword") : t("account.updatePassword")}
                </button>
              </motion.form>
            ) : mode === "passwordUpdated" ? (
              <motion.div
                key="password-updated"
                className="account-sheet-copy account-confirmation"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <span className="account-confirmation-icon" aria-hidden="true"><FontAwesomeIcon icon={faCheck} /></span>
                <h2 id="account-auth-title">{t("account.passwordUpdatedTitle")}</h2>
                <p>{t("account.passwordUpdatedBody")}</p>
                <button className="account-primary-button" type="button" onClick={finishRecovery}>
                  {t("account.continueToAccount")}
                </button>
              </motion.div>
            ) : mode === "forgotPassword" ? (
              <motion.form
                key="forgot-password"
                className="account-sheet-copy"
                onSubmit={submitPasswordReset}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <button className="account-back-button" type="button" onClick={() => switchMode("signIn")}>
                  <FontAwesomeIcon icon={faArrowLeft} />
                  <span>{t("common.back")}</span>
                </button>
                <p className="account-kicker">FrankCards</p>
                <h2 id="account-auth-title">{t("account.forgotPasswordTitle")}</h2>
                <p>{t("account.forgotPasswordBody")}</p>
                <label className="account-field">
                  <span>{t("account.emailLabel")}</span>
                  <input
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      clearMessages();
                    }}
                    autoComplete="email"
                    required
                    placeholder={t("account.emailPlaceholder")}
                  />
                </label>
                {renderMessage()}
                <button className="account-primary-button" type="submit" disabled={isWorking || !email.trim()}>
                  {isWorking ? t("account.sendingResetLink") : t("account.sendResetLink")}
                </button>
              </motion.form>
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

                <label className="account-field">
                  <span>{t("account.emailLabel")}</span>
                  <input
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      clearMessages();
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
                      clearMessages();
                    }}
                    autoComplete={mode === "signUp" ? "new-password" : "current-password"}
                    minLength={8}
                    required
                    placeholder={t("account.passwordPlaceholder")}
                  />
                </label>

                {mode === "signUp" ? <p className="account-form-note">{t("account.passwordHint")}</p> : null}
                {renderMessage()}

                <button className="account-primary-button" type="submit" disabled={isWorking || !email.trim() || password.length < 8}>
                  {isWorking
                    ? t(mode === "signUp" ? "account.creatingAccount" : "account.signingIn")
                    : t(mode === "signUp" ? "account.createAccount" : "account.signIn")}
                </button>

                {mode === "signIn" ? (
                  <div className="account-auth-links">
                    <button className="account-text-button" type="button" onClick={() => switchMode("forgotPassword")} disabled={isWorking}>
                      {t("account.forgotPassword")}
                    </button>
                    <button className="account-text-button" type="button" onClick={() => switchMode("signUp")} disabled={isWorking}>
                      {t("account.needAccount")}
                    </button>
                  </div>
                ) : null}
              </motion.form>
            )}
          </AnimatePresence>
        )}
      </motion.section>
    </motion.div>
  );
}
