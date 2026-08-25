import type { TopicLanguage, TopicListOptions, TopicRecord } from "../../types/Topic";
import { normalizeConversationGame } from "./normalizeConversationGame";
import type { ReadableTopicRepository } from "./TopicRepository";

const FALLBACK_GAME_FILES = [
  "bdsm-exploration.json",
  "confidence-boost.json",
  "end-of-day.json",
  "ex-friend.json",
  "gratitude-journal.json",
  "how-you-dare.json",
  "laugh-out-loud.json",
  "long-distance.json",
  "meaningful-connections.json",
  "relationship-audit.json",
  "relationship-check.json",
  "seconda-date.json",
  "self-love.json",
  "situation.json",
  "sneaky-link.json",
  "talking-with-parents.json",
  "test-love-36.json",
  "truth_truth.json",
  "we-are-not-really-strangers.json",
  "we-are-not-really-strangers2.json",
  "what-if-worlds.json",
  "xxx.json",
] as const;

const languagePath = (fileName: string, language: TopicLanguage): string => {
  if (language === "en") return `/games/en/${fileName}`;
  const extensionIndex = fileName.lastIndexOf(".");
  const baseName = extensionIndex >= 0 ? fileName.slice(0, extensionIndex) : fileName;
  const extension = extensionIndex >= 0 ? fileName.slice(extensionIndex) : "";
  return `/games/zh/${baseName}-CN${extension}`;
};

const loadJson = async (url: string): Promise<unknown> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed with ${response.status}: ${url}`);
  return response.json();
};

export class BuiltInTopicRepository implements ReadableTopicRepository {
  readonly source = "built-in" as const;
  private readonly cache = new Map<TopicLanguage, Promise<TopicRecord[]>>();

  list(options: TopicListOptions = {}): Promise<TopicRecord[]> {
    const language = options.language ?? "en";
    const cached = this.cache.get(language);
    if (cached) return cached;

    const request = this.loadLanguage(language).catch((error) => {
      this.cache.delete(language);
      throw error;
    });
    this.cache.set(language, request);
    return request;
  }

  async getById(id: string, options: TopicListOptions = {}): Promise<TopicRecord | null> {
    const topics = await this.list(options);
    return topics.find((topic) => topic.id === id) ?? null;
  }

  clearCache(language?: TopicLanguage): void {
    if (language) this.cache.delete(language);
    else this.cache.clear();
  }

  private async loadLanguage(language: TopicLanguage): Promise<TopicRecord[]> {
    let files: readonly string[] = FALLBACK_GAME_FILES;

    try {
      const index = await loadJson("/games/index.json");
      if (
        typeof index === "object"
        && index !== null
        && "games" in index
        && Array.isArray(index.games)
      ) {
        files = index.games.filter((file): file is string => typeof file === "string");
      }
    } catch (error) {
      console.warn("Could not load the built-in topic index; using the bundled fallback list.", error);
    }

    const topics = await Promise.all(files.map(async (file): Promise<TopicRecord | null> => {
      try {
        let raw: unknown;
        try {
          raw = await loadJson(languagePath(file, language));
        } catch (localizedError) {
          if (language === "en") throw localizedError;
          raw = await loadJson(languagePath(file, "en"));
        }

        const game = normalizeConversationGame(raw);
        return {
          id: game.testID,
          ownerId: null,
          source: "built-in",
          language,
          visibility: "public",
          status: "published",
          version: 1,
          createdAt: null,
          updatedAt: null,
          publishedAt: null,
          game,
        };
      } catch (error) {
        console.warn(`Failed to load built-in topic: ${file}`, error);
        return null;
      }
    }));

    return topics.filter((topic): topic is TopicRecord => topic !== null);
  }
}

export const builtInTopicRepository = new BuiltInTopicRepository();
