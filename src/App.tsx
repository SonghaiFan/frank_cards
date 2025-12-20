import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./App.css";
import { ConversationGame } from "./types/ConversationGame";
import GameLibrary from "./components/GameLibrary";
import QuickGameLibrary from "./components/QuickGameLibrary";
import GameController from "./components/GameController";
import MinimumScreenSize from "./components/MinimumScreenSize";
import { useScreenSize } from "./hooks/useScreenSize";

function App() {
  const { i18n } = useTranslation();
  const [games, setGames] = useState<ConversationGame[]>([]);
  
  // Refactor state for multi-selection
  const [selectedGames, setSelectedGames] = useState<ConversationGame[]>([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const { isMinimumSizeMet } = useScreenSize();

  useEffect(() => {
    loadGames();
  }, [i18n.language]); // React to language changes

  // Clear selections when language changes to avoid conflicting content
  useEffect(() => {
    setSelectedGames([]);
    setIsSessionActive(false);
  }, [i18n.language]);

  const loadGames = async () => {
    setLoading(true);
    try {
      let gameFiles: string[] = [];

      // Load games from index.json
      try {
        const indexResponse = await fetch("/games/index.json");
        if (indexResponse.ok) {
          const index = await indexResponse.json();
          gameFiles = index.games || [];
        }
      } catch (indexError) {
        console.warn("Could not load index.json, using hardcoded games");
        gameFiles = [
          "deep-connections.json",
          "relationship-check.json",
          "test-love.json",
          "test-love-36.json",
          "we-are-not-strangers.json",
          "we-are-not-really-strangers.json",
        ];
      }

      const loadedGames: ConversationGame[] = [];

      // Get the language folder
      const languageFolder = i18n.language.startsWith("zh") ? "zh" : "en";

      for (const file of gameFiles) {
        try {
          // Determine the correct file path based on language
          const filePath = getLanguageSpecificFilePath(file, languageFolder);

          const response = await fetch(filePath);
          if (response.ok) {
            const game = await response.json();
            loadedGames.push(game);
          } else {
            // Fallback to English version if language-specific version doesn't exist
            const fallbackPath = `/games/en/${file}`;
            const fallbackResponse = await fetch(fallbackPath);
            if (fallbackResponse.ok) {
              const game = await fallbackResponse.json();
              loadedGames.push(game);
            }
          }
        } catch (error) {
          console.warn(`Failed to load game: ${file}`, error);
        }
      }

      setGames(loadedGames);
    } catch (error) {
      console.error("Failed to load games:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get language-specific file path
  const getLanguageSpecificFilePath = (
    fileName: string,
    languageFolder: string
  ): string => {
    if (languageFolder === "en") {
      return `/games/en/${fileName}`;
    }

    // For Chinese, we need to convert the base filename to include -CN suffix
    const fileParts = fileName.split(".");
    const extension = fileParts.pop();
    const baseName = fileParts.join(".");

    return `/games/zh/${baseName}-CN.${extension}`;
  };

  // View Mode: 'customize' or 'quick'
  const [viewMode, setViewMode] = useState<"customize" | "quick">("customize");
  
  // Auto-start flag for Quick Mode
  const [shouldAutoStart, setShouldAutoStart] = useState(false);

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
        setShouldAutoStart(false); // Default flow
        setIsSessionActive(true);
    }
  };

  const handleQuickStart = (game: ConversationGame) => {
      setSelectedGames([game]);
      setShouldAutoStart(true); // Enable auto-start for Quick Mode
      setIsSessionActive(true);
  };

  const handleGameExit = () => {
    setIsSessionActive(false);
    setShouldAutoStart(false);
  };

  // Check if screen meets minimum size requirements
  if (!isMinimumSizeMet) {
    return <MinimumScreenSize />;
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col justify-center items-center bg-white dark:bg-black overflow-hidden">
        <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-primary rounded-full animate-spin mb-6"></div>
        <p className="text-lg text-gray-600 dark:text-gray-300 font-light">
          Loading conversations...
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col">
       {/* Top Bar for Mode Switching (Only visible when not playing) */}
       {!isSessionActive && (
           <div className="w-full h-16 bg-white dark:bg-black border-b border-gray-100 dark:border-gray-900 flex items-center justify-between px-8 absolute top-0 z-50">
               <div className="font-black text-xl tracking-tight">CueCards</div>
               
               <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-full">
                   <button 
                    onClick={() => setViewMode("customize")}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${viewMode === "customize" ? "bg-white dark:bg-black shadow-sm text-black dark:text-white" : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"}`}
                   >
                       Custom
                   </button>
                   <button 
                    onClick={() => setViewMode("quick")}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${viewMode === "quick" ? "bg-white dark:bg-black shadow-sm text-black dark:text-white" : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"}`}
                   >
                       Quick Play
                   </button>
               </div>
               
               <div className="w-20" /> {/* Spacer for balance */}
           </div>
       )}

      <div className="flex-1 w-full h-full pt-16 relative">
          {isSessionActive ? (
            <GameController
            key={selectedGames.map(g => g.testID).join("-")} 
            games={selectedGames}
            onExit={handleGameExit}
            autoStart={shouldAutoStart}
            />
        ) : (
            viewMode === "quick" ? (
                // Import QuickGameLibrary dynamically or use existing import
                <QuickGameLibrary 
                    games={games}
                    onStartGame={handleQuickStart}
                />
            ) : (
                <GameLibrary 
                    games={games} 
                    selectedGames={selectedGames}
                    onToggleGame={handleToggleGame} 
                    onStartSession={handleStartSession}
                />
            )
        )}
      </div>
    </div>
  );
}

export default App;
