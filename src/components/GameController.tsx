import React, { useState, useEffect } from "react";
import { ConversationGame } from "../types/ConversationGame";
import GameLanding from "./GameLanding";
import GameSettings from "./GameSettings";
import GamePlay from "./GamePlay";
import GameEnding from "./GameEnding";

// Game stages enum
enum GameStage {
  LANDING = "landing",
  SETTINGS = "settings",
  PLAYING = "playing",
  ENDING = "ending",
}

interface GameControllerProps {
  games: ConversationGame[];
  onExit: () => void;
  autoStart?: boolean;
}

const GameController: React.FC<GameControllerProps> = ({ games, onExit, autoStart }) => {
  console.log("GameController mounted with games:", games?.length);
  
  const [currentStage, setCurrentStage] = useState<GameStage>(GameStage.PLAYING);
  const [syntheticGame, setSyntheticGame] = useState<ConversationGame | null>(null);
  const [mixedQuestions, setMixedQuestions] = useState<any[]>([]);

  // Single Game specific state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [questionPercentage, setQuestionPercentage] = useState(100);

  useEffect(() => {
    console.log("Processing games in GameController");
    if (!games || games.length === 0) {
        console.error("No games provided to GameController");
        return;
    }

    // CASE 1: Single Game Selected
    if (games.length === 1) {
        const singleGame = games[0];
        setSyntheticGame(singleGame);
        setSelectedCategories(Object.keys(singleGame.theme.categories));
        
        if (autoStart) {
            // Immediate Start for Quick Mode
            // We need to trigger generation here because the effect runs once
            // But we can't call generateSingleGameQuestions directly inside useEffect safely without dependencies
            // So we set a flag or handle it by setting stage and relying on a separate effect
            // OR: simpler, just define the helper outside or use a ref.
            // Actually, we can just set the state and let a 2nd effect handle "If playing and no questions, generate"
            // BUT: easiest way -> just call a robust generator or set stage to PLAYING and have a guard in render?
            
            // Let's modify the logic: set stage to PLAYING. 
            // We need to ensure questions are generated. 
            // Let's make generateQuestions accessible or duplicating the simple "all questions" logic here.
            
            // Let's make generateQuestions accessible or duplicating the simple "all questions" logic here.
            
            // BETTER: Use the existing generateQuestions helper? It relies on state that might not be set yet (syntheticGame).
            // Since we just setSyntheticGame, it won't be in state this render cycle.
            // PROPER FIX: Use the 'singleGame' variable directly to generate questions.
            
            // Prepare questions for Immediate Play (Default: All categories, 100%)
            const processedQuestions: any[] = [];
            singleGame.questions.forEach(cat => {
                const catQuestions = cat.questions.map((q, qIndex) => ({
                    ...q,
                    category: cat.category,
                    categoryIndex: singleGame.questions.findIndex(c => c.category === cat.category),
                    questionIndex: qIndex,
                    originGame: singleGame.app.title
                }));
                
                // Shuffle WITHIN this specific category
                const shuffledCatQuestions = [...catQuestions].sort(() => Math.random() - 0.5);
                processedQuestions.push(...shuffledCatQuestions);
            });
            
            // For Quick Mode, follow category order but random within categories
            // Move 'end' type questions to the very end of the entire session
            const endQuestions = processedQuestions.filter((q: any) => q.type === "end");
            const nonEndQuestions = processedQuestions.filter((q: any) => q.type !== "end");
            const finalSequence = [...nonEndQuestions, ...endQuestions];

            setMixedQuestions(finalSequence);
            setCurrentStage(GameStage.PLAYING);

        } else {
            // Standard Flow
            setCurrentStage(GameStage.LANDING);
        }
        return;
    }

    // CASE 2: Multiple Games Selected -> Merge and Prepare for Settings
    if (games.length > 1) {
        // 1. Merge Categories
        const mergedCategories: Record<string, any> = {};
        const mergedQuestions: any[] = [];

        games.forEach((game) => {
            // Add each category with unique key
            Object.entries(game.theme.categories).forEach(([key, category]) => {
                const uniqueKey = `${game.testID}_${key}`;
                mergedCategories[uniqueKey] = {
                ...category,
                name: `${(category.name.length > 15 ? category.name.substring(0,12) + "..." : category.name)} (${game.app.title})`, // Append game title for clarity in settings
                originGame: game.app.title 
                };
            });

            // Add questions grouped by new unique category
            game.questions.forEach((qGroup: any) => {
                const uniqueKey = `${game.testID}_${qGroup.category}`;
                
                // Remap inner questions to use the new category key
                const questionsWithType = qGroup.questions.map((q: any) => ({
                    ...q,
                    category: uniqueKey,
                    originGame: game.app.title
                }));

                mergedQuestions.push({
                    category: uniqueKey,
                    questions: questionsWithType
                });
            });
        });

        // 2. Create Synthetic Game Object with STRUCTURED questions (for Settings)
        const newSyntheticGame: ConversationGame = {
            testID: "mixed-session",
            app: {
                title: "Mixed Session",
                subtitle: `${games.length} Packs Combined`,
                language: games[0].app.language, 
                type: "normal",
                playerGroup: games[0].app.playerGroup
            },
            ui: games[0].ui, 
            theme: {
                categories: mergedCategories
            },
            questions: mergedQuestions // Essential for Settings to work!
        };

        setSyntheticGame(newSyntheticGame);
        
        // Initialize all categories as selected
        setSelectedCategories(Object.keys(mergedCategories));

        // Go to Settings for Multi-Pack too!
        setCurrentStage(GameStage.SETTINGS);
    }

  }, [games]);


  // Helper: Generate questions based on settings (Unified for Single & Multi)
  const generateQuestions = () => {
        if (!syntheticGame) return [];
        
        const game = syntheticGame;
        const categoryQuestions: any[] = [];

        game.questions
        .filter((categoryData: any) =>
            selectedCategories.includes(categoryData.category)
        )
        .forEach((categoryData: any) => {
            const questions = categoryData.questions.map(
            (question: any, qIndex: number) => ({
                ...question,
                categoryIndex: game.questions.findIndex(
                (cat: any) => cat.category === categoryData.category
                ),
                questionIndex: qIndex,
                category: categoryData.category,
            })
            );

            if (questions.length > 0) {
            categoryQuestions.push({
                category: categoryData.category,
                questions: questions,
            });
            }
        });

        // Calculate total questions to take
        const totalAvailableQuestions = categoryQuestions.reduce(
            (sum, catData) => sum + catData.questions.length,
            0
        );

        const totalQuestions = Math.round(
            (totalAvailableQuestions * questionPercentage) / 100
        );

        // Distribute questions proportionally across categories
        const questionsPerCategory = categoryQuestions.map((catData) => {
            const proportion = catData.questions.length / totalAvailableQuestions;
            const questionsForCategory = Math.round(proportion * totalQuestions);
            return {
                ...catData,
                targetCount: Math.max(1, questionsForCategory), // Ensure at least 1 question per category
            };
        });

        // Adjust for rounding differences
        const actualTotal = questionsPerCategory.reduce(
            (sum, cat) => sum + cat.targetCount,
            0
        );
        if (actualTotal > totalQuestions) {
            // Remove questions from the category with the most questions
            const maxCategory = questionsPerCategory.reduce((max, cat) =>
                cat.targetCount > max.targetCount ? cat : max
            );
            maxCategory.targetCount -= actualTotal - totalQuestions;
        }

        // Randomly sample questions from each category
        const finalQuestions: any[] = [];
        questionsPerCategory.forEach((catData) => {
            const shuffledQuestions = [...catData.questions].sort(
                () => 0.5 - Math.random()
            );
            const selectedQuestions = shuffledQuestions.slice(0, catData.targetCount);
            finalQuestions.push(...selectedQuestions);
        });

        // Move 'end' type questions to the end
        const endQuestions = finalQuestions.filter((q: any) => q.type === "end");
        const nonEndQuestions = finalQuestions.filter((q: any) => q.type !== "end");
        return [...nonEndQuestions, ...endQuestions];
  };


  // Stage navigation handlers
  const handleStart = () => {
    setCurrentStage(GameStage.SETTINGS);
  };

  const handleBackToLanding = () => {
    if (games.length > 1) {
        // For Multi-Pack, "Back" from settings should exit to Home
        onExit(); 
    } else {
        // For Single Pack, "Back" goes to Landing
        setCurrentStage(GameStage.LANDING);
    }
  };

  const handleStartGame = () => {
     // Unified Logic: Generate questions based on settings
     const customQuestionSet = generateQuestions();
     setMixedQuestions(customQuestionSet);
     setCurrentStage(GameStage.PLAYING);
  };

  const handleGameComplete = () => {
    setCurrentStage(GameStage.ENDING);
  };

  const handleRestart = () => {
    if (games.length === 1) {
        // Return to landing for single game
        setCurrentStage(GameStage.LANDING);
    } else {
        // Return to Settings for Multi-Pack
        setCurrentStage(GameStage.SETTINGS);
    }
  };

  if (!syntheticGame) return null;

  // Render current stage
  switch (currentStage) {
    case GameStage.LANDING:
      return <GameLanding game={syntheticGame} onStart={handleStart} onExit={onExit} />;

    case GameStage.SETTINGS:
      return (
        <GameSettings
          game={syntheticGame}
          selectedCategories={selectedCategories}
          onCategoryChange={setSelectedCategories}
          questionPercentage={questionPercentage}
          onPercentageChange={setQuestionPercentage}
          onStartGame={handleStartGame}
          onBack={handleBackToLanding}
        />
      );

    case GameStage.PLAYING:
      return (
        <GamePlay
          game={syntheticGame}
          questions={mixedQuestions}
          onExit={onExit}
          onComplete={handleGameComplete}
        />
      );

    case GameStage.ENDING:
      return (
        <GameEnding 
            game={syntheticGame} 
            onRestart={handleRestart} 
            onExit={onExit} 
        />
      );

    default:
      return null;
  }
};

export default GameController;
