import type { ConversationGame } from "./ConversationGame";

export const TOPIC_LANGUAGES = ["en", "zh"] as const;
export const TOPIC_VISIBILITIES = ["private", "public"] as const;
export const TOPIC_STATUSES = ["draft", "pending_review", "published", "rejected", "archived"] as const;

export type TopicLanguage = (typeof TOPIC_LANGUAGES)[number];
export type TopicVisibility = (typeof TOPIC_VISIBILITIES)[number];
export type TopicStatus = (typeof TOPIC_STATUSES)[number];
export type TopicSource = "built-in" | "user";

export interface TopicRecord {
  id: string;
  ownerId: string | null;
  source: TopicSource;
  language: TopicLanguage;
  visibility: TopicVisibility;
  status: TopicStatus;
  version: number;
  createdAt: string | null;
  updatedAt: string | null;
  publishedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  game: ConversationGame;
}

export interface TopicListOptions {
  language?: TopicLanguage;
  scope?: "available" | "mine" | "review";
}

export interface SaveTopicInput {
  game: ConversationGame;
  language: TopicLanguage;
  visibility?: TopicVisibility;
  status?: TopicStatus;
}

export function toTopicLanguage(language: string): TopicLanguage {
  return language.toLowerCase().startsWith("zh") || language.toLowerCase().startsWith("chinese")
    ? "zh"
    : "en";
}

export function toGameLanguage(language: TopicLanguage): string {
  return language === "zh" ? "chinese" : "english";
}
