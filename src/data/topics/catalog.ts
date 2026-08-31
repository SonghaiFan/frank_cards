import type { TopicListOptions, TopicRecord } from "../../types/Topic";
import { isSupabaseConfigured } from "../supabase/client";
import { builtInTopicRepository } from "./BuiltInTopicRepository";

export const listBuiltInTopics = (options: TopicListOptions = {}): Promise<TopicRecord[]> => (
  builtInTopicRepository.list(options)
);

export const listCommunityTopics = async (options: TopicListOptions = {}): Promise<TopicRecord[]> => {
  if (!isSupabaseConfigured()) return [];
  return import("./SupabaseTopicRepository")
    .then(({ createUserTopicRepository }) => createUserTopicRepository().list({ ...options, scope: "available" }))
    .catch((error) => {
      console.warn("Community topics are temporarily unavailable.", error);
      return [] as TopicRecord[];
    });
};

export const clearAvailableTopicsCache = (language?: TopicListOptions["language"]): void => {
  builtInTopicRepository.clearCache(language);
};
