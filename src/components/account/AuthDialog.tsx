import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../auth/AuthProvider";

interface AuthDialogProps {
  onClose: () => void;
}

export default function AuthDialog({ onClose }: AuthDialogProps) {
  const { t } = useTranslation();
  const { clearError, error, isWorking, requestEmailOtp, status, verifyEmailOtp } = useAuth();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const focusTimer = window.setTimeout(() => {
      if (step === "email") emailRef.current?.focus();
      else codeRef.current?.focus();
    }, 80);
    return () => window.clearTimeout(focusTimer);
  }, [step]);

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

  const sendEmail = async () => {
    if (!email.trim()) return;
    try {
      await requestEmailOtp(email);
      setStep("code");
    } catch {
      // AuthProvider exposes the readable error beside the field.
    }
  };

  const submitEmail = (event: FormEvent) => {
    event.preventDefault();
    void sendEmail();
  };

  const submitCode = async (event: FormEvent) => {
    event.preventDefault();
    if (code.trim().length < 6) return;
    try {
      await verifyEmailOtp(email, code);
      onClose();
    } catch {
      // AuthProvider exposes the readable error beside the field.
    }
  };

  const goBack = () => {
    clearError();
    setCode("");
    setStep("email");
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
            <button className="account-primary-button" type="button" onClick={onClose}>
              {t("account.keepExploring")}
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            {step === "email" ? (
              <motion.form
                key="email"
                className="account-sheet-copy"
                onSubmit={submitEmail}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <p className="account-kicker">FrankCards</p>
                <h2 id="account-auth-title">{t("account.signInTitle")}</h2>
                <p>{t("account.signInBody")}</p>

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

                {error ? <p className="account-field-error" role="alert">{error}</p> : null}

                <button className="account-primary-button" type="submit" disabled={isWorking || !email.trim()}>
                  {isWorking ? t("account.sendingCode") : t("account.sendCode")}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="code"
                className="account-sheet-copy"
                onSubmit={submitCode}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <button className="account-back-button" type="button" onClick={goBack}>
                  <FontAwesomeIcon icon={faArrowLeft} />
                  <span>{t("common.back")}</span>
                </button>
                <h2 id="account-auth-title">{t("account.codeTitle")}</h2>
                <p>{t("account.codeBody", { email })}</p>

                <label className="account-field">
                  <span>{t("account.codeLabel")}</span>
                  <input
                    ref={codeRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={8}
                    value={code}
                    onChange={(event) => {
                      setCode(event.target.value.replace(/\D/g, ""));
                      if (error) clearError();
                    }}
                    required
                    placeholder="000000"
                    className="account-code-input"
                  />
                </label>

                {error ? <p className="account-field-error" role="alert">{error}</p> : null}

                <button className="account-primary-button" type="submit" disabled={isWorking || code.trim().length < 6}>
                  {isWorking ? t("account.verifying") : t("account.verify")}
                </button>
                <button className="account-text-button" type="button" onClick={() => void sendEmail()} disabled={isWorking}>
                  {t("account.sendAgain")}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        )}
      </motion.section>
    </motion.div>
  );
}
