import React from "react";
import { ConversationGame } from "../types/ConversationGame";
import Button from "./Button";
import ContourText from "./ContourText";

interface GameInfoPanelProps {
  uiColor?: string;
  game: ConversationGame;
  onStart?: () => void;
  showStartButton?: boolean;
}

const GameInfoPanel: React.FC<GameInfoPanelProps> = ({ 
  uiColor,
  game, 
  onStart, 
  showStartButton = true 
}) => {
  const titleLength = Array.from(game.ui.startScreen.title.trim()).length;
  const hasLongTitle = titleLength > 18;

  return (
    <div data-game-info-panel className="flex h-[40dvh] min-h-72 max-h-[21rem] w-full min-w-0 max-w-full flex-col text-center lg:ml-auto lg:h-[34rem] lg:min-h-0 lg:max-h-none lg:w-full lg:text-right xl:w-[34rem]">
      <div data-game-info-scroll className="min-h-0 flex-1 overflow-y-auto no-scrollbar py-2">
        <div className="flex min-h-full min-w-0 flex-col justify-center">
          <h1
            className={`theme-text-primary mb-6 max-w-full whitespace-normal break-words text-3xl font-black leading-tight tracking-tight transition-colors duration-700 [text-wrap:balance] sm:mb-8 sm:text-4xl md:text-5xl lg:ml-auto lg:max-w-[17rem] xl:max-w-[19rem] xl:text-5xl ${hasLongTitle ? "2xl:text-5xl" : "2xl:text-6xl"}`}
            style={uiColor ? { color: uiColor } : undefined}
          >
            {game.ui.startScreen.title}
          </h1>

          <ContourText
            color={uiColor}
            paragraphs={game.ui.startScreen.description}
            className="theme-text-secondary text-base font-light leading-relaxed transition-colors duration-700 sm:text-lg md:text-xl"
          />
        </div>

      </div>

      {showStartButton && onStart && (
        <div className="flex shrink-0 justify-center pt-6 lg:justify-end lg:pt-8">
          <Button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="font-semibold"
            variant="primary"
            onClick={onStart}
          >
            {game.ui.startScreen.startButton}
          </Button>
        </div>
      )}
    </div>
  );
};

export default GameInfoPanel;
