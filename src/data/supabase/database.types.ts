export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type TopicAppType = "normal" | "edition" | "premium";
export type TopicLanguage = "en" | "zh";
export type TopicStatus = "draft" | "published" | "archived";
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
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
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
          navigation: Json;
          end_screen: Json;
          categories: Json;
          questions: Json;
          version: number;
          created_at: string;
          updated_at: string;
          published_at: string | null;
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
          navigation: Json;
          end_screen: Json;
          categories: Json;
          questions: Json;
          version?: number;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
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
          navigation?: Json;
          end_screen?: Json;
          categories?: Json;
          questions?: Json;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
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
