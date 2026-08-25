import type { TopicListOptions, TopicRecord } from "../../types/Topic";
import { isSupabaseConfigured } from "../supabase/client";
import { builtInTopicRepository } from "./BuiltInTopicRepository";

export const listAvailableTopics = async (options: TopicListOptions = {}): Promise<TopicRecord[]> => {
  const builtInRequest = builtInTopicRepository.list(options);
  if (!isSupabaseConfigured()) return builtInRequest;

  const userRequest = import("./SupabaseTopicRepository")
    .then(({ createUserTopicRepository }) => createUserTopicRepository().list(options))
    .catch((error) => {
      console.warn("User topics are temporarily unavailable; continuing with built-in topics.", error);
      return [] as TopicRecord[];
    });

  const [builtInTopics, userTopics] = await Promise.all([builtInRequest, userRequest]);
  return [...userTopics, ...builtInTopics];
};
