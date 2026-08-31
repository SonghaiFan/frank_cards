import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { ConversationGame } from "../../types/ConversationGame";
import type { SaveTopicInput, TopicListOptions, TopicRecord } from "../../types/Topic";
import { toGameLanguage, toTopicLanguage } from "../../types/Topic";
import { getSupabaseClient } from "../supabase/client";
import type { Database, Json, TopicInsert, TopicRow, TopicUpdate } from "../supabase/database.types";
import { normalizeConversationGame } from "./normalizeConversationGame";
import type { MutableTopicRepository } from "./TopicRepository";
import { TopicRepositoryError } from "./TopicRepository";

const asJson = (value: unknown): Json => value as Json;

interface TopicCreator {
  display_name: string | null;
  avatar_url: string | null;
}

const rowToRecord = (row: TopicRow, creator?: TopicCreator): TopicRecord => {
  const game = normalizeConversationGame({
    testID: row.id,
    app: {
      title: row.title,
      subtitle: row.subtitle,
      language: toGameLanguage(row.language),
      type: row.app_type,
      playerGroup: row.player_groups,
      version: String(row.version),
    },
    ui: {
      startScreen: row.start_screen,
      endScreen: row.end_screen,
    },
    theme: { categories: row.categories },
    questions: row.questions,
  });

  if (creator) {
    game.creator = {
      displayName: creator.display_name,
      avatarUrl: creator.avatar_url,
    };
  }

  return {
    id: row.id,
    ownerId: row.owner_id,
    source: "user",
    language: row.language,
    visibility: row.visibility,
    status: row.status,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    rejectionReason: row.rejection_reason,
    game,
  };
};

const gameToInsert = (input: SaveTopicInput, ownerId: string): TopicInsert => {
  const game = normalizeConversationGame(input.game);
  return {
    owner_id: ownerId,
    title: game.app.title,
    subtitle: game.app.subtitle,
    language: input.language,
    app_type: game.app.type,
    player_groups: game.app.playerGroup,
    visibility: input.visibility ?? "private",
    status: input.status ?? "draft",
    start_screen: asJson(game.ui.startScreen),
    end_screen: asJson(game.ui.endScreen),
    categories: asJson(game.theme.categories),
    questions: asJson(game.questions),
  };
};

const gameToUpdate = (input: SaveTopicInput): TopicUpdate => {
  const game = normalizeConversationGame(input.game);
  return {
    title: game.app.title,
    subtitle: game.app.subtitle,
    language: input.language,
    app_type: game.app.type,
    player_groups: game.app.playerGroup,
    visibility: input.visibility ?? "private",
    status: input.status ?? "draft",
    start_screen: asJson(game.ui.startScreen),
    end_screen: asJson(game.ui.endScreen),
    categories: asJson(game.theme.categories),
    questions: asJson(game.questions),
  };
};

const requireUser = async (client: SupabaseClient<Database>): Promise<User> => {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    throw new TopicRepositoryError("You must be signed in to save a topic.", error);
  }
  return data.user;
};

export class SupabaseTopicRepository implements MutableTopicRepository {
  readonly source = "user" as const;

  async list(options: TopicListOptions = {}): Promise<TopicRecord[]> {
    try {
      const client = await getSupabaseClient();
      let query = client
        .from("topics")
        .select("*");

      if (options.language) query = query.eq("language", options.language);
      if (options.scope === "mine") {
        const user = await requireUser(client);
        query = query.eq("owner_id", user.id);
      } else if (options.scope === "review") {
        await requireUser(client);
        query = query.eq("status", "pending_review");
      } else {
        query = query.eq("visibility", "public").eq("status", "published");
      }

      query = query.order("updated_at", { ascending: options.scope === "review" });

      const { data, error } = await query;
      if (error) throw error;

      if (options.scope === "mine" || options.scope === "review" || data.length === 0) {
        return data.map((row) => rowToRecord(row));
      }

      const ownerIds = Array.from(new Set(data.map((row) => row.owner_id)));
      const { data: creators, error: creatorsError } = await client
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", ownerIds);
      if (creatorsError) throw creatorsError;
      const creatorsById = new Map(creators.map((creator) => [creator.id, creator]));
      return data.map((row) => rowToRecord(row, creatorsById.get(row.owner_id)));
    } catch (error) {
      if (error instanceof TopicRepositoryError) throw error;
      throw new TopicRepositoryError("Could not load user topics.", error);
    }
  }

  async getById(id: string): Promise<TopicRecord | null> {
    try {
      const client = await getSupabaseClient();
      const { data, error } = await client
        .from("topics")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? rowToRecord(data) : null;
    } catch (error) {
      throw new TopicRepositoryError("Could not load the topic.", error);
    }
  }

  async create(input: SaveTopicInput): Promise<TopicRecord> {
    try {
      const client = await getSupabaseClient();
      const user = await requireUser(client);
      const { data, error } = await client
        .from("topics")
        .insert(gameToInsert(input, user.id))
        .select("*")
        .single();
      if (error) throw error;
      return rowToRecord(data);
    } catch (error) {
      if (error instanceof TopicRepositoryError) throw error;
      throw new TopicRepositoryError("Could not create the topic.", error);
    }
  }

  async update(id: string, input: SaveTopicInput): Promise<TopicRecord> {
    try {
      const client = await getSupabaseClient();
      await requireUser(client);
      const { data, error } = await client
        .from("topics")
        .update(gameToUpdate(input))
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return rowToRecord(data);
    } catch (error) {
      if (error instanceof TopicRepositoryError) throw error;
      throw new TopicRepositoryError("Could not update the topic.", error);
    }
  }

  async submitForReview(id: string): Promise<TopicRecord> {
    try {
      const client = await getSupabaseClient();
      await requireUser(client);
      const { data, error } = await client
        .from("topics")
        .update({
          status: "pending_review",
          visibility: "private",
        })
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return rowToRecord(data);
    } catch (error) {
      if (error instanceof TopicRepositoryError) throw error;
      throw new TopicRepositoryError("Could not submit the topic for review.", error);
    }
  }

  async withdrawFromCommunity(id: string): Promise<TopicRecord> {
    try {
      const client = await getSupabaseClient();
      await requireUser(client);
      const { data, error } = await client
        .from("topics")
        .update({ status: "draft", visibility: "private" })
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return rowToRecord(data);
    } catch (error) {
      if (error instanceof TopicRepositoryError) throw error;
      throw new TopicRepositoryError("Could not withdraw the topic.", error);
    }
  }

  async review(id: string, decision: "approve" | "reject", reason?: string): Promise<TopicRecord> {
    try {
      const client = await getSupabaseClient();
      await requireUser(client);
      const { data, error } = await client.rpc("review_topic", {
        topic_id: id,
        decision,
        reason: reason?.trim() || null,
      });
      if (error) throw error;
      return rowToRecord(data);
    } catch (error) {
      if (error instanceof TopicRepositoryError) throw error;
      throw new TopicRepositoryError("Could not review the topic.", error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const client = await getSupabaseClient();
      await requireUser(client);
      const { error } = await client.from("topics").delete().eq("id", id);
      if (error) throw error;
    } catch (error) {
      if (error instanceof TopicRepositoryError) throw error;
      throw new TopicRepositoryError("Could not delete the topic.", error);
    }
  }
}

export const createUserTopicRepository = (): SupabaseTopicRepository => new SupabaseTopicRepository();

export const conversationGameLanguage = (game: ConversationGame) => toTopicLanguage(game.app.language);
