export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type TopicAppType = "normal" | "edition" | "premium";
export type TopicLanguage = "en" | "zh";
export type TopicStatus = "draft" | "pending_review" | "published" | "rejected" | "archived";
export type TopicVisibility = "private" | "public";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
          is_admin: boolean;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          is_admin?: boolean;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
          is_admin?: boolean;
        };
        Relationships: [];
      };
      topics: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          subtitle: string;
          language: TopicLanguage;
          app_type: TopicAppType;
          player_groups: string[];
          visibility: TopicVisibility;
          status: TopicStatus;
          start_screen: Json;
          end_screen: Json;
          categories: Json;
          questions: Json;
          version: number;
          created_at: string;
          updated_at: string;
          published_at: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          rejection_reason: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          subtitle?: string;
          language: TopicLanguage;
          app_type?: TopicAppType;
          player_groups: string[];
          visibility?: TopicVisibility;
          status?: TopicStatus;
          start_screen: Json;
          end_screen: Json;
          categories: Json;
          questions: Json;
          version?: number;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          rejection_reason?: string | null;
        };
        Update: {
          title?: string;
          subtitle?: string;
          language?: TopicLanguage;
          app_type?: TopicAppType;
          player_groups?: string[];
          visibility?: TopicVisibility;
          status?: TopicStatus;
          start_screen?: Json;
          end_screen?: Json;
          categories?: Json;
          questions?: Json;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          rejection_reason?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_current_user_topic_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      review_topic: {
        Args: {
          topic_id: string;
          decision: string;
          reason?: string | null;
        };
        Returns: TopicRow;
      };
    };
    Enums: {
      topic_app_type: TopicAppType;
      topic_language: TopicLanguage;
      topic_status: TopicStatus;
      topic_visibility: TopicVisibility;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type TopicRow = Database["public"]["Tables"]["topics"]["Row"];
export type TopicInsert = Database["public"]["Tables"]["topics"]["Insert"];
export type TopicUpdate = Database["public"]["Tables"]["topics"]["Update"];
