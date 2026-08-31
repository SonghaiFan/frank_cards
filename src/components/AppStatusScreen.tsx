import { useTranslation } from "react-i18next";

type AppStatusVariant = "error" | "empty";

interface AppStatusScreenProps {
  variant: AppStatusVariant;
  onRetry?: () => void;
}

export default function AppStatusScreen({ variant, onRetry }: AppStatusScreenProps) {
  const { t } = useTranslation();
  const isError = variant === "error";
  const title = isError ? t("gameLibrary.loadErrorTitle") : t("gameLibrary.noGames");
  const body = isError ? t("gameLibrary.loadErrorBody") : t("gameLibrary.emptyBody");

  return (
    <main
      className={`app-status-screen material-canvas app-status-${variant}`}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
    >
      <div className="app-status-content">
        <div className="app-status-symbol" aria-hidden="true">
          {isError ? "!" : "···"}
        </div>

        <div className="app-status-copy">
          <p className="app-status-kicker">FrankCards</p>
          <h1>{title}</h1>
          <p>{body}</p>
        </div>

        {onRetry ? (
          <button className="app-status-retry" type="button" onClick={onRetry}>
            {t("gameLibrary.tryAgain")}
          </button>
        ) : null}
      </div>
    </main>
  );
}
