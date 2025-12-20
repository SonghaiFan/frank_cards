export interface AppInfo {
  title: string;
  subtitle: string;
  language: string;
  type: "normal" | "edition" | "premium";
  playerGroup: ("solo" | "couple" | "friends" | "strangers" | "family")[];
  version?: string;
}

export interface StartScreen {
  title: string;
  description: string[];
  startButton: string;
}

export interface Navigation {
  nextButton: string;
  prevButton: string;
}

export interface EndScreen {
  title: string;
  subtitle: string;
  restartButton: string;
}

export interface UIConfig {
  startScreen: StartScreen;
  navigation: Navigation;
  endScreen: EndScreen;
}

export interface Category {
  name: string;
  color: string;
  description: string;
  originGame?: string;
}

export interface ThemeConfig {
  categories: Record<string, Category>;
}

export interface ExportTemplate {
  header: string;
  category: string;
  question: string;
  separator: string;
}

export interface Question {
  type?: "open" | "end" | "wildcard";
  question: string;
  more?: string[] | Record<string, string>;
}

export interface QuestionCategory {
  category: string;
  questions: Question[];
}

export interface ConversationGame {
  testID: string;
  app: AppInfo;
  ui: UIConfig;
  theme: ThemeConfig;
  questions: QuestionCategory[];
}

export interface GameLibrary {
  games: ConversationGame[];
  lastUpdated: string;
}

export interface GameAnswer {
  questionIndex: number;
  categoryIndex: number;
  selectedOption: string;
  answerText: string;
}

export interface GameSession {
  gameId: string;
  startTime: Date;
  answers: GameAnswer[];
  currentQuestionIndex: number;
  currentCategoryIndex: number;
}
