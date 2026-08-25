import { getContrastColor } from "./color";

interface ResolveGameSurfaceThemeOptions {
  categoryColor: string;
  isDarkTheme?: boolean;
  isWildcard?: boolean;
}

export interface GameSurfaceTheme {
  backgroundColor: string;
  cardColor: string;
  cardTextColor: string;
  uiColor: string;
}

export const resolveUiColor = (backgroundColor: string) => getContrastColor(backgroundColor);

export const resolveGameSurfaceTheme = ({
  categoryColor,
  isDarkTheme = false,
  isWildcard = false,
}: ResolveGameSurfaceThemeOptions): GameSurfaceTheme => {
  const canvasColor = isDarkTheme ? "#191917" : "#fdfdfa";
  const backgroundColor = isWildcard ? canvasColor : categoryColor;
  const cardColor = isWildcard ? categoryColor : canvasColor;

  return {
    backgroundColor,
    cardColor,
    cardTextColor: resolveUiColor(cardColor),
    uiColor: resolveUiColor(backgroundColor),
  };
};
