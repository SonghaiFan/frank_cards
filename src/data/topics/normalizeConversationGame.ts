import {
  PLAYER_GROUPS,
  type Category,
  type ConversationGame,
  type ConversationGameType,
  type EndScreen,
  type Navigation,
  type PlayerGroup,
  type Question,
  type QuestionCategory,
  type QuestionType,
  type StartScreen,
} from "../../types/ConversationGame";

const GAME_TYPES = new Set<ConversationGameType>(["normal", "edition", "premium"]);
const QUESTION_TYPES = new Set<QuestionType>(["open", "discussion", "end", "wildcard"]);
const PLAYER_GROUP_SET = new Set<string>(PLAYER_GROUPS);

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === "object" && value !== null && !Array.isArray(value)
);

const requiredString = (value: unknown, path: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${path} must be a non-empty string`);
  }
  return value;
};

const optionalString = (value: unknown, fallback = ""): string => (
  typeof value === "string" ? value : fallback
);

const normalizePlayerGroup = (value: unknown, path: string): PlayerGroup => {
  const normalized = value === "couples" ? "couple" : value;
  if (typeof normalized !== "string" || !PLAYER_GROUP_SET.has(normalized)) {
    throw new Error(`${path} contains an unsupported player group`);
  }
  return normalized as PlayerGroup;
};

const normalizeStartScreen = (value: unknown): StartScreen => {
  if (!isRecord(value)) throw new Error("ui.startScreen must be an object");
  return {
    title: requiredString(value.title, "ui.startScreen.title"),
    description: Array.isArray(value.description)
      ? value.description.flatMap((item, index) => {
          if (typeof item !== "string") {
            throw new Error(`ui.startScreen.description[${index}] must be a string`);
          }
          const description = item.trim();
          return description ? [description] : [];
        })
      : [],
    startButton: requiredString(value.startButton, "ui.startScreen.startButton"),
  };
};

const normalizeNavigation = (value: unknown): Navigation => {
  if (!isRecord(value)) throw new Error("ui.navigation must be an object");
  return {
    nextButton: requiredString(value.nextButton, "ui.navigation.nextButton"),
    prevButton: requiredString(value.prevButton, "ui.navigation.prevButton"),
  };
};

const normalizeEndScreen = (value: unknown): EndScreen => {
  if (!isRecord(value)) throw new Error("ui.endScreen must be an object");
  return {
    title: requiredString(value.title, "ui.endScreen.title"),
    subtitle: optionalString(value.subtitle),
    restartButton: requiredString(value.restartButton, "ui.endScreen.restartButton"),
  };
};

const normalizeCategory = (value: unknown, path: string): Category => {
  if (!isRecord(value)) throw new Error(`${path} must be an object`);
  return {
    name: requiredString(value.name, `${path}.name`),
    color: requiredString(value.color, `${path}.color`),
    description: optionalString(value.description),
    ...(typeof value.originGame === "string" ? { originGame: value.originGame } : {}),
  };
};

const normalizeQuestion = (value: unknown, path: string): Question => {
  if (!isRecord(value)) throw new Error(`${path} must be an object`);

  const rawType = value.type;
  if (rawType !== undefined && (typeof rawType !== "string" || !QUESTION_TYPES.has(rawType as QuestionType))) {
    throw new Error(`${path}.type is unsupported`);
  }

  const more = value.more;
  const normalizedMore = Array.isArray(more)
    ? more.map((item, index) => requiredString(item, `${path}.more[${index}]`))
    : isRecord(more)
      ? Object.fromEntries(Object.entries(more).map(([key, item]) => [key, requiredString(item, `${path}.more.${key}`)]))
      : undefined;

  return {
    ...(rawType ? { type: rawType as QuestionType } : {}),
    question: requiredString(value.question, `${path}.question`),
    ...(normalizedMore ? { more: normalizedMore } : {}),
  };
};

const normalizeQuestionCategory = (value: unknown, index: number): QuestionCategory => {
  const path = `questions[${index}]`;
  if (!isRecord(value)) throw new Error(`${path} must be an object`);
  if (!Array.isArray(value.questions)) throw new Error(`${path}.questions must be an array`);

  return {
    category: requiredString(value.category, `${path}.category`),
    questions: value.questions.map((question, questionIndex) => (
      normalizeQuestion(question, `${path}.questions[${questionIndex}]`)
    )),
  };
};

export function normalizeConversationGame(value: unknown): ConversationGame {
  if (!isRecord(value)) throw new Error("Topic must be an object");
  if (!isRecord(value.app)) throw new Error("app must be an object");
  if (!isRecord(value.ui)) throw new Error("ui must be an object");
  if (!isRecord(value.theme) || !isRecord(value.theme.categories)) {
    throw new Error("theme.categories must be an object");
  }
  if (!Array.isArray(value.questions)) throw new Error("questions must be an array");

  const appType = value.app.type;
  if (typeof appType !== "string" || !GAME_TYPES.has(appType as ConversationGameType)) {
    throw new Error("app.type is unsupported");
  }
  if (!Array.isArray(value.app.playerGroup)) throw new Error("app.playerGroup must be an array");
  const playerGroups = Array.from(new Set(value.app.playerGroup.map((group, index) => (
    normalizePlayerGroup(group, `app.playerGroup[${index}]`)
  ))));
  if (playerGroups.length === 0) throw new Error("app.playerGroup must contain at least one group");

  const categories = Object.fromEntries(
    Object.entries(value.theme.categories).map(([key, category]) => [
      key,
      normalizeCategory(category, `theme.categories.${key}`),
    ]),
  );
  const questions = value.questions.map(normalizeQuestionCategory);
  const categoryKeys = new Set(Object.keys(categories));

  for (const group of questions) {
    if (!categoryKeys.has(group.category)) {
      throw new Error(`questions references missing category: ${group.category}`);
    }
  }

  return {
    testID: requiredString(value.testID, "testID"),
    app: {
      title: requiredString(value.app.title, "app.title"),
      subtitle: optionalString(value.app.subtitle),
      language: requiredString(value.app.language, "app.language"),
      type: appType as ConversationGameType,
      playerGroup: playerGroups,
      ...(typeof value.app.version === "string" ? { version: value.app.version } : {}),
    },
    ui: {
      startScreen: normalizeStartScreen(value.ui.startScreen),
      navigation: normalizeNavigation(value.ui.navigation),
      endScreen: normalizeEndScreen(value.ui.endScreen),
    },
    theme: { categories },
    questions,
  };
}
