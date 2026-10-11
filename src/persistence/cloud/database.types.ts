export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      urb_forbidden_handle_words: {
        Row: {
          word: string;
        };
        ComputedFields: never;
        Insert: {
          word: string;
        };
        Update: {
          word?: string;
        };
        Relationships: [];
      };
      urb_friendships: {
        Row: {
          actor_id: string;
          created_at: string;
          state: string;
          updated_at: string;
          user_high: string;
          user_low: string;
        };
        ComputedFields: never;
        Insert: {
          actor_id: string;
          created_at?: string;
          state: string;
          updated_at?: string;
          user_high: string;
          user_low: string;
        };
        Update: {
          actor_id?: string;
          created_at?: string;
          state?: string;
          updated_at?: string;
          user_high?: string;
          user_low?: string;
        };
        Relationships: [
          {
            foreignKeyName: "urb_friendships_user_high_fkey";
            columns: ["user_high"];
            isOneToOne: false;
            referencedRelation: "urb_profiles";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "urb_friendships_user_low_fkey";
            columns: ["user_low"];
            isOneToOne: false;
            referencedRelation: "urb_profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      urb_messages: {
        Row: {
          body: string;
          created_at: string;
          id: number;
          read_at: string | null;
          recipient_id: string;
          sender_id: string;
        };
        ComputedFields: never;
        Insert: {
          body: string;
          created_at?: string;
          id?: never;
          read_at?: string | null;
          recipient_id: string;
          sender_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: never;
          read_at?: string | null;
          recipient_id?: string;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "urb_messages_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "urb_profiles";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "urb_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "urb_profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      urb_profiles: {
        Row: {
          created_at: string;
          findable: boolean;
          handle: string;
          handle_changed_at: string;
          social_revision: number;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          findable?: boolean;
          handle: string;
          handle_changed_at?: string;
          social_revision?: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          findable?: boolean;
          handle?: string;
          handle_changed_at?: string;
          social_revision?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      urb_saves: {
        Row: {
          client_saved_at: string;
          created_at: string;
          envelope: NonNullable<Json>;
          format_version: number;
          revision: number;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          client_saved_at: string;
          created_at?: string;
          envelope: NonNullable<Json>;
          format_version: number;
          revision: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          client_saved_at?: string;
          created_at?: string;
          envelope?: NonNullable<Json>;
          format_version?: number;
          revision?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      urb_search_attempts: {
        Row: {
          attempted_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          attempted_at?: string;
          user_id: string;
        };
        Update: {
          attempted_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      urb_accept_friend_request: { Args: { p_user: string }; Returns: undefined };
      urb_are_friends: { Args: { p_a: string; p_b: string }; Returns: boolean };
      urb_block_user: { Args: { p_user: string }; Returns: undefined };
      urb_bump_social: { Args: { p_user: string }; Returns: undefined };
      urb_delete_conversation: { Args: { p_a: string; p_b: string }; Returns: undefined };
      urb_delete_my_saves: { Args: Record<PropertyKey, never>; Returns: undefined };
      urb_friend_count: { Args: { p_user: string }; Returns: number };
      urb_list_messages: { Args: { p_after?: number; p_with: string }; Returns: Json };
      urb_list_saves: {
        Args: Record<PropertyKey, never>;
        Returns: {
          client_saved_at: string;
          created_at: string;
          format_version: number;
          revision: number;
          updated_at: string;
        }[];
      };
      urb_list_social: { Args: { p_cursor?: number }; Returns: Json };
      urb_open_request: { Args: { p_from: string; p_to: string }; Returns: undefined };
      urb_outgoing_count: { Args: { p_user: string }; Returns: number };
      urb_purge_inactive_anonymous_users: { Args: Record<PropertyKey, never>; Returns: undefined };
      urb_purge_old_messages: { Args: Record<PropertyKey, never>; Returns: undefined };
      urb_push_save: {
        Args: {
          p_base_revision: number;
          p_client_saved_at: string;
          p_envelope: Json;
          p_format_version: number;
          p_keep_previous?: boolean;
        };
        Returns: number;
      };
      urb_refuse_friend_request: { Args: { p_user: string }; Returns: undefined };
      urb_remove_friend: { Args: { p_user: string }; Returns: undefined };
      urb_restore_save: { Args: { p_revision: number }; Returns: number };
      urb_send_friend_request_by_email: { Args: { p_email: string }; Returns: undefined };
      urb_send_message: { Args: { p_body: string; p_to: string }; Returns: number };
      urb_set_findable: { Args: { p_findable: boolean }; Returns: undefined };
      urb_set_handle: { Args: { p_handle: string }; Returns: undefined };
      urb_social_member: { Args: Record<PropertyKey, never>; Returns: string };
      urb_unblock_user: { Args: { p_user: string }; Returns: undefined };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
