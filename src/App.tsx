import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, MotionConfig, type Variants } from "motion/react";
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
type AuthEntryMode = "signIn" | "signUp";
type AppLanguage = "en" | "zh";

const loadTopicsForLanguage = async (language: AppLanguage) => {
  const topicLanguage = toTopicLanguage(language);
  const [builtInTopics, communityTopics] = await Promise.all([
    listBuiltInTopics({ language: topicLanguage }),
    listCommunityTopics({ language: topicLanguage }),
  ]);
  return {
    communityGames: communityTopics.map((topic) => topic.game),
    games: builtInTopics.map((topic) => topic.game),
  };
};

const librarySceneVariants: Variants = {
  active: { opacity: 1 },
  exit: (preserveBackdrop: boolean) => ({
    // During a pack launch the outgoing library remains as the visual
    // backdrop until GamePlay's color surface has finished filling in.
    opacity: preserveBackdrop ? 0.999 : 0,
    transition: {
      duration: preserveBackdrop ? 1.65 : 1.4,
      ease: "easeInOut",
    },
  }),
};

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
  const [isLanguageSwitching, setIsLanguageSwitching] = useState(false);
  const { height: viewportHeight, isMinimumSizeMet, width: viewportWidth } = useScreenSize();

  useEffect(() => {
    let cancelled = false;
    const language: AppLanguage = i18n.resolvedLanguage?.startsWith("zh") ? "zh" : "en";
    if (games.length === 0) setLoadStatus("loading");

    loadTopicsForLanguage(language)
      .then((topics) => {
        if (!cancelled) {
          setGames(topics.games);
          setCommunityGames(topics.communityGames);
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
  }, [loadAttempt]);

  const handleChangeLanguage = useCallback(async (language: AppLanguage) => {
    const currentLanguage: AppLanguage = i18n.resolvedLanguage?.startsWith("zh") ? "zh" : "en";
    if (language === currentLanguage || isLanguageSwitching) return;

    setIsLanguageSwitching(true);
    try {
      const topics = await loadTopicsForLanguage(language);
      await i18n.changeLanguage(language);
      setGames(topics.games);
      setCommunityGames(topics.communityGames);
      setSelectedGames([]);
      setIsSessionActive(false);
      setLoadStatus("ready");
    } catch (error) {
      console.error("Failed to switch language:", error);
    } finally {
      setIsLanguageSwitching(false);
    }
  }, [i18n, isLanguageSwitching]);

  // View Mode: 'customize' or 'quick'
  const [viewMode, setViewMode] = useState<"customize" | "quick">("quick");

  const [sessionMode, setSessionMode] = useState<"quick" | "custom">("quick");
  const [authDialogRequest, setAuthDialogRequest] = useState<{ id: number; mode: AuthEntryMode }>({
    id: 0,
    mode: "signIn",
  });
  const [pendingCustomUnlock, setPendingCustomUnlock] = useState(false);
  const packIds = useMemo(() => (
    [...games, ...communityGames].map((game) => game.testID)
  ), [communityGames, games]);

  const requestAuthentication = useCallback((mode: AuthEntryMode = "signIn") => {
    setAuthDialogRequest((request) => ({ id: request.id + 1, mode }));
  }, []);

  const handleSwitchToCustom = useCallback(() => {
    if (authStatus === "authenticated") {
      setViewMode("customize");
      return;
    }
    setPendingCustomUnlock(true);
    requestAuthentication("signUp");
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

  const statusVariant = loadStatus === "error"
      ? "error"
      : loadStatus === "ready" && games.length === 0
        ? "empty"
        : null;

  return (
    <PackLikesProvider packIds={packIds} onRequireAuth={() => requestAuthentication("signIn")}>
      <MotionConfig reducedMotion="user">
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
                  onRetry={handleRetryTopics}
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
                {!isSessionActive && loadStatus === "ready" ? (
                  <AccountHub
                    authDialogRequest={authDialogRequest}
                    isLanguageSwitching={isLanguageSwitching}
                    onChangeLanguage={handleChangeLanguage}
                    onTopicsChanged={handleTopicsChanged}
                    onUseTopic={handleQuickStart}
                  />
                ) : null}
                <div className="relative isolate h-full w-full flex-1 overflow-hidden">
                  <AnimatePresence custom={isSessionActive} initial={false} mode="sync">
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
                          sessionEntryId={selectedGames.length === 1 ? `session-entry-${selectedGames[0].testID}` : undefined}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key={`library-${viewMode}`}
                        data-scene="library"
                        className="absolute inset-0 z-10 overflow-hidden"
                        initial={false}
                        animate="active"
                        exit="exit"
                        variants={librarySceneVariants}
                      >
                        <LayoutGroup id={`frankcards-library-${viewMode}`}>
                          {viewMode === "quick" ? (
                            <QuickGameLibrary
                              games={games}
                              isLoading={loadStatus === "loading"}
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
                        </LayoutGroup>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </MotionConfig>
    </PackLikesProvider>
  );
}

export default App;
