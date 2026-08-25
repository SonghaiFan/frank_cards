const parseHexColor = (hexColor: string) => {
  const normalized = hexColor.trim().replace("#", "");
  const hex = normalized.length === 3
    ? normalized.split("").map((character) => character + character).join("")
    : normalized.slice(0, 6);

  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;

  return [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
};

const toLinearChannel = (channel: number) => {
  const value = channel / 255;
  return value <= 0.04045
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4);
};

export const getRelativeLuminance = (hexColor: string) => {
  const channels = parseHexColor(hexColor);
  if (!channels) return 1;

  const [red, green, blue] = channels.map(toLinearChannel);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

export const getContrastRatio = (foreground: string, background: string) => {
  const foregroundLuminance = getRelativeLuminance(foreground);
  const backgroundLuminance = getRelativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
};

export const getContrastColor = (backgroundColor: string): string => {
  const darkUi = "#000000";
  const lightUi = "#ffffff";
  return getContrastRatio(darkUi, backgroundColor) >= getContrastRatio(lightUi, backgroundColor)
    ? darkUi
    : lightUi;
};
