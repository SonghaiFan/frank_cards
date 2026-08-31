import { useTranslation } from "react-i18next";
import type { CSSProperties } from "react";
import LoadingConversationIllustration from "./LoadingConversationIllustration";

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
      {isLoading ? (
        <>
          <div
            className="theme-color-blur-background app-loading-background"
            aria-hidden="true"
            style={{
              "--theme-mesh-1": "#9ca283",
              "--theme-mesh-2": "#d6ddd7",
              "--theme-mesh-3": "#c2c9b4",
              "--theme-mesh-4": "#d9d7ca",
              "--theme-mesh-5": "#aeb59f",
            } as CSSProperties}
          >
            <div className="theme-color-blur-mesh">
              <div className="theme-color-blur-field theme-color-blur-field-primary" />
              <div className="theme-color-blur-field theme-color-blur-field-secondary" />
            </div>
          </div>
          <LoadingConversationIllustration />
        </>
      ) : null}

      <div className={`app-status-content${isLoading ? " app-status-content-loading" : ""}`}>
        {!isLoading ? (
          <div className="app-status-symbol" aria-hidden="true">
            {variant === "error" ? "!" : "···"}
          </div>
        ) : null}

        {isLoading ? (
          <div className="app-loading-brand">
            <h1 aria-label="FrankCards">
              <span className="sr-only">Frank</span>
              <span aria-hidden="true" className="frank-signature" />
              <span>Cards</span>
            </h1>
            <p>{body}</p>
            <span className="sr-only">{title}</span>
          </div>
        ) : (
          <div className="app-status-copy">
            <p className="app-status-kicker">FrankCards</p>
            <h1>{title}</h1>
            <p>{body}</p>
          </div>
        )}

        {!isLoading && onRetry ? (
          <button className="app-status-retry" type="button" onClick={onRetry}>
            {t("gameLibrary.tryAgain")}
          </button>
        ) : null}
      </div>
    </main>
  );
}
