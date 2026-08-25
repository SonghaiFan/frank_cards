import { useState, useEffect } from "react";
import { AnimatePresence, LayoutGroup, motion, MotionConfig } from "motion/react";
import { useTranslation } from "react-i18next";
import "./App.css";
import type { ConversationGame } from "./types/ConversationGame";
import GameLibrary from "./components/CustomGameLibrary";
import QuickGameLibrary from "./components/GameLibrary";
import GameController from "./components/GameController";
import MinimumScreenSize from "./components/MinimumScreenSize";
import { useScreenSize } from "./hooks/useScreenSize";
import { listAvailableTopics } from "./data/topics/catalog";
import { toTopicLanguage } from "./types/Topic";
import AccountHub from "./components/account/AccountHub";

function App() {
  const { i18n } = useTranslation();
  const [games, setGames] = useState<ConversationGame[]>([]);

  // Refactor state for multi-selection
  const [selectedGames, setSelectedGames] = useState<ConversationGame[]>([]);
  const [isSessionActive, setIsSessionActive] = useState(false);

  const [loading, setLoading] = useState(true);
  const { height: viewportHeight, isMinimumSizeMet, width: viewportWidth } = useScreenSize();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    listAvailableTopics({
      language: toTopicLanguage(i18n.language),
      scope: "available",
    })
      .then((topics) => {
        if (!cancelled) setGames(topics.map((topic) => topic.game));
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to load topics:", error);
          setGames([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [i18n.language]);

  // Clear selections when language changes to avoid conflicting content
  useEffect(() => {
    setSelectedGames([]);
    setIsSessionActive(false);
  }, [i18n.language]);

  // View Mode: 'customize' or 'quick'
  const [viewMode, setViewMode] = useState<"customize" | "quick">("quick");

  const [sessionMode, setSessionMode] = useState<"quick" | "custom">("quick");

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

  // Check if screen meets minimum size requirements
  if (!isMinimumSizeMet) {
    return <MinimumScreenSize height={viewportHeight} width={viewportWidth} />;
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col justify-center items-center overflow-hidden material-canvas">
        <div className="theme-spinner w-8 h-8 border-2 rounded-full animate-spin mb-6"></div>
        <p className="theme-text-secondary text-lg font-light">
          Loading conversations...
        </p>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup id="frankcards-conversation-stage">
        <div className="h-screen w-screen overflow-hidden flex flex-col material-canvas">
          {!isSessionActive ? <AccountHub /> : null}
          <div className="flex-1 w-full h-full relative isolate overflow-hidden">
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
                      onSwitchToCustom={() => setViewMode("customize")}
                    />
                  ) : (
                    <GameLibrary
                      games={games}
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
        </div>
      </LayoutGroup>
    </MotionConfig>
  );
}

export default App;
