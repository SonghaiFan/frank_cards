import { useTranslation } from "react-i18next";

type AppStatusVariant = "loading" | "error" | "empty";

interface AppStatusScreenProps {
  variant: AppStatusVariant;
  onRetry?: () => void;
}

export default function AppStatusScreen({ variant, onRetry }: AppStatusScreenProps) {
  const { t } = useTranslation();
  const isLoading = variant === "loading";
  const isError = variant === "error";

  const title = isLoading
    ? t("gameLibrary.loading")
    : variant === "error"
      ? t("gameLibrary.loadErrorTitle")
      : t("gameLibrary.noGames");
  const body = isLoading
    ? t("gameLibrary.loadingBody")
    : variant === "error"
      ? t("gameLibrary.loadErrorBody")
      : t("gameLibrary.emptyBody");

  return (
    <main
      className={`app-status-screen material-canvas app-status-${variant}`}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      aria-busy={isLoading}
    >
      <div className="app-status-content">
        {isLoading ? (
          <div className="app-loading-mark" aria-hidden="true">
            <span className="app-loading-halo" />
            <img src="/card-icon.svg" alt="" />
          </div>
        ) : (
          <div className="app-status-symbol" aria-hidden="true">
            {variant === "error" ? "!" : "···"}
          </div>
        )}

        <div className="app-status-copy">
          <p className="app-status-kicker">FrankCards</p>
          <h1>{title}</h1>
          <p>{body}</p>
        </div>

        {isLoading ? (
          <div className="app-loading-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        ) : onRetry ? (
          <button className="app-status-retry" type="button" onClick={onRetry}>
            {t("gameLibrary.tryAgain")}
          </button>
        ) : null}
      </div>
    </main>
  );
}
