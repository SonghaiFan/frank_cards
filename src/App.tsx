import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, MotionConfig } from "motion/react";
import { useTranslation } from "react-i18next";
import "./App.css";
import type { ConversationGame } from "./types/ConversationGame";
import GameLibrary from "./components/CustomGameLibrary";
import QuickGameLibrary from "./components/GameLibrary";
import GameController from "./components/GameController";
import MinimumScreenSize from "./components/MinimumScreenSize";
import { useScreenSize } from "./hooks/useScreenSize";
import { clearAvailableTopicsCache, listBuiltInTopics, listCommunityTopics } from "./data/topics/catalog";
import { toTopicLanguage } from "./types/Topic";
import AccountHub from "./components/account/AccountHub";
import AppStatusScreen from "./components/AppStatusScreen";
import { useAuth } from "./auth/AuthProvider";
import { PackLikesProvider } from "./social/PackLikesProvider";

type TopicLoadStatus = "loading" | "ready" | "error";

function App() {
  const { i18n } = useTranslation();
  const { status: authStatus } = useAuth();
  const [games, setGames] = useState<ConversationGame[]>([]);
  const [communityGames, setCommunityGames] = useState<ConversationGame[]>([]);

  // Refactor state for multi-selection
  const [selectedGames, setSelectedGames] = useState<ConversationGame[]>([]);
  const [isSessionActive, setIsSessionActive] = useState(false);

  const [loadStatus, setLoadStatus] = useState<TopicLoadStatus>("loading");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const { height: viewportHeight, isMinimumSizeMet, width: viewportWidth } = useScreenSize();

  useEffect(() => {
    let cancelled = false;
    setLoadStatus("loading");
    setGames([]);
    setCommunityGames([]);

    const language = toTopicLanguage(i18n.language);
    Promise.all([
      listBuiltInTopics({ language }),
      listCommunityTopics({ language }),
    ])
      .then(([builtInTopics, communityTopics]) => {
        if (!cancelled) {
          setGames(builtInTopics.map((topic) => topic.game));
          setCommunityGames(communityTopics.map((topic) => topic.game));
          setLoadStatus("ready");
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to load topics:", error);
          setLoadStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [i18n.language, loadAttempt]);

  // Clear selections when language changes to avoid conflicting content
  useEffect(() => {
    setSelectedGames([]);
    setIsSessionActive(false);
  }, [i18n.language]);

  // View Mode: 'customize' or 'quick'
  const [viewMode, setViewMode] = useState<"customize" | "quick">("quick");

  const [sessionMode, setSessionMode] = useState<"quick" | "custom">("quick");
  const [authDialogRequest, setAuthDialogRequest] = useState(0);
  const [pendingCustomUnlock, setPendingCustomUnlock] = useState(false);
  const packIds = useMemo(() => (
    [...games, ...communityGames].map((game) => game.testID)
  ), [communityGames, games]);

  const requestAuthentication = useCallback(() => {
    setAuthDialogRequest((request) => request + 1);
  }, []);

  const handleSwitchToCustom = useCallback(() => {
    if (authStatus === "authenticated") {
      setViewMode("customize");
      return;
    }
    setPendingCustomUnlock(true);
    requestAuthentication();
  }, [authStatus, requestAuthentication]);

  useEffect(() => {
    if (authStatus !== "authenticated" || !pendingCustomUnlock) return;
    setPendingCustomUnlock(false);
    setViewMode("customize");
  }, [authStatus, pendingCustomUnlock]);

  // Toggle selection for a game
  const handleToggleGame = (game: ConversationGame) => {
    console.log("Toggling game:", game.testID);
    setSelectedGames(prev => {
      const exists = prev.some(g => g.testID === game.testID);
      let newSelection;
      if (exists) {
        newSelection = prev.filter(g => g.testID !== game.testID);
      } else {
        newSelection = [...prev, game];
      }
      console.log("New selection count:", newSelection.length);
      return newSelection;
    });
  };

  const handleStartSession = () => {
    console.log("Starting session with games:", selectedGames.length);
    if (selectedGames.length > 0) {
      setSessionMode("custom");
      setIsSessionActive(true);
    }
  };

  const handleQuickStart = (game: ConversationGame) => {
    setSelectedGames([game]);
    setSessionMode("quick");
    setIsSessionActive(true);
  };

  const handleGameExit = () => {
    setIsSessionActive(false);
    if (sessionMode === "quick") {
      setSelectedGames([]);
    }
  };

  const handleRetryTopics = () => {
    clearAvailableTopicsCache(toTopicLanguage(i18n.language));
    setLoadAttempt((attempt) => attempt + 1);
  };

  const handleTopicsChanged = () => {
    setLoadAttempt((attempt) => attempt + 1);
  };

  // Check if screen meets minimum size requirements
  if (!isMinimumSizeMet) {
    return <MinimumScreenSize height={viewportHeight} width={viewportWidth} />;
  }

  const statusVariant = loadStatus === "loading"
    ? "loading"
    : loadStatus === "error"
      ? "error"
      : games.length === 0
        ? "empty"
        : null;

  return (
    <PackLikesProvider packIds={packIds} onRequireAuth={requestAuthentication}>
      <MotionConfig reducedMotion="user">
      <LayoutGroup id="frankcards-conversation-stage">
        <div className="relative h-[100dvh] w-screen overflow-hidden material-canvas">
          <AnimatePresence initial={false} mode="sync">
            {statusVariant ? (
              <motion.div
                key={`app-status-${statusVariant}`}
                data-app-scene="status"
                className="absolute inset-0 z-30 overflow-hidden"
                initial={{ opacity: 0, y: 10, scale: 0.995 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.985 }}
                transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
              >
                <AppStatusScreen
                  variant={statusVariant}
                  onRetry={statusVariant === "loading" ? undefined : handleRetryTopics}
                />
              </motion.div>
            ) : (
              <motion.div
                key="app-library-shell"
                data-app-scene="library-shell"
                className="absolute inset-0 z-10 flex flex-col overflow-hidden"
                initial={{ opacity: 0, y: 14, scale: 1.008 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.995 }}
                transition={{
                  duration: 0.88,
                  delay: 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {!isSessionActive ? (
                  <AccountHub
                    authDialogRequest={authDialogRequest}
                    onTopicsChanged={handleTopicsChanged}
                    onUseTopic={handleQuickStart}
                  />
                ) : null}
                <div className="relative isolate h-full w-full flex-1 overflow-hidden">
                  <AnimatePresence initial={false} mode="sync">
                    {isSessionActive ? (
                      <motion.div
                        key={`session-${selectedGames.map((game) => game.testID).join("-")}`}
                        data-scene="game"
                        className="absolute inset-0 z-20 overflow-hidden"
                        initial={false}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <GameController
                          games={selectedGames}
                          onExit={handleGameExit}
                          mode={sessionMode}
                          sharedLayoutId={selectedGames.length === 1 ? `active-card-${selectedGames[0].testID}` : undefined}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key={`library-${viewMode}`}
                        data-scene="library"
                        className="absolute inset-0 z-10 overflow-hidden"
                        initial={false}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.4, ease: "easeInOut" }}
                      >
                        {viewMode === "quick" ? (
                          <QuickGameLibrary
                            games={games}
                            onStartGame={handleQuickStart}
                            onSwitchToCustom={handleSwitchToCustom}
                          />
                        ) : (
                          <GameLibrary
                            games={games}
                            communityGames={communityGames}
                            selectedGames={selectedGames}
                            onToggleGame={handleToggleGame}
                            onStartSession={handleStartSession}
                            onBackToQuick={() => setViewMode("quick")}
                            onClearSelection={() => setSelectedGames([])}
                          />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </LayoutGroup>
      </MotionConfig>
    </PackLikesProvider>
  );
}

export default App;
