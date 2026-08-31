import type { TopicListOptions, TopicRecord, SaveTopicInput } from "../../types/Topic";

export interface ReadableTopicRepository {
  readonly source: "built-in" | "user";
  list(options?: TopicListOptions): Promise<TopicRecord[]>;
  getById(id: string, options?: TopicListOptions): Promise<TopicRecord | null>;
}

export interface MutableTopicRepository extends ReadableTopicRepository {
  create(input: SaveTopicInput): Promise<TopicRecord>;
  update(id: string, input: SaveTopicInput): Promise<TopicRecord>;
  submitForReview(id: string): Promise<TopicRecord>;
  withdrawFromCommunity(id: string): Promise<TopicRecord>;
  review(id: string, decision: "approve" | "reject", reason?: string): Promise<TopicRecord>;
  delete(id: string): Promise<void>;
}

export class TopicRepositoryError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "TopicRepositoryError";
  }
}
