export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      urb_challenge_acceptances: {
        Row: {
          accepted_at: string;
          challenge_id: string;
          city_id: string;
          completed_at: string | null;
          deadline: string;
          state: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          accepted_at?: string;
          challenge_id: string;
          city_id: string;
          completed_at?: string | null;
          deadline: string;
          state?: string;
          user_id: string;
        };
        Update: {
          accepted_at?: string;
          challenge_id?: string;
          city_id?: string;
          completed_at?: string | null;
          deadline?: string;
          state?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "urb_challenge_acceptances_challenge_id_fkey";
            columns: ["challenge_id"];
            isOneToOne: false;
            referencedRelation: "urb_challenges";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "urb_challenge_acceptances_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "urb_profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      urb_challenge_templates: {
        Row: {
          band: number;
          difficulty: string;
          goal: NonNullable<Json>;
          id: number;
        };
        ComputedFields: never;
        Insert: {
          band: number;
          difficulty: string;
          goal: NonNullable<Json>;
          id?: never;
        };
        Update: {
          band?: number;
          difficulty?: string;
          goal?: NonNullable<Json>;
          id?: never;
        };
        Relationships: [];
      };
      urb_challenges: {
        Row: {
          created_at: string;
          difficulty: string | null;
          ends_at: string;
          goal: NonNullable<Json>;
          id: string;
          kind: string;
          medal_code: string | null;
          min_citizens: number;
          name_en: string | null;
          name_fr: string | null;
          name_keys: NonNullable<Json>;
          reward_kind: string;
          starts_at: string;
          urb_challenge_json: Json | null;
        };
        ComputedFields: "urb_challenge_json";
        Insert: {
          created_at?: string;
          difficulty?: string | null;
          ends_at: string;
          goal: NonNullable<Json>;
          id?: string;
          kind: string;
          medal_code?: string | null;
          min_citizens?: number;
          name_en?: string | null;
          name_fr?: string | null;
          name_keys: NonNullable<Json>;
          reward_kind: string;
          starts_at: string;
        };
        Update: {
          created_at?: string;
          difficulty?: string | null;
          ends_at?: string;
          goal?: NonNullable<Json>;
          id?: string;
          kind?: string;
          medal_code?: string | null;
          min_citizens?: number;
          name_en?: string | null;
          name_fr?: string | null;
          name_keys?: NonNullable<Json>;
          reward_kind?: string;
          starts_at?: string;
        };
        Relationships: [];
      };
      urb_donations: {
        Row: {
          created_at: string;
          id: string;
          user_id: string;
          value: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id: string;
          user_id: string;
          value: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          user_id?: string;
          value?: number;
        };
        Relationships: [
          {
            foreignKeyName: "urb_donations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "urb_profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
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
      urb_group_members: {
        Row: {
          group_id: string;
          joined_at: string;
          last_read_message_id: number;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          group_id: string;
          joined_at?: string;
          last_read_message_id?: number;
          user_id: string;
        };
        Update: {
          group_id?: string;
          joined_at?: string;
          last_read_message_id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "urb_group_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "urb_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "urb_group_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "urb_profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      urb_group_messages: {
        Row: {
          body: string;
          created_at: string;
          group_id: string;
          id: number;
          sender_id: string;
        };
        ComputedFields: never;
        Insert: {
          body: string;
          created_at?: string;
          group_id: string;
          id?: never;
          sender_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          group_id?: string;
          id?: never;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "urb_group_messages_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "urb_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "urb_group_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "urb_profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      urb_groups: {
        Row: {
          created_at: string;
          creator_id: string;
          id: string;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          creator_id: string;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          creator_id?: string;
          id?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "urb_groups_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "urb_profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      urb_medals: {
        Row: {
          challenge_id: string | null;
          earned_at: string;
          id: string;
          medal_code: string;
          name_en: string | null;
          name_fr: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          challenge_id?: string | null;
          earned_at?: string;
          id?: string;
          medal_code: string;
          name_en?: string | null;
          name_fr?: string | null;
          user_id: string;
        };
        Update: {
          challenge_id?: string | null;
          earned_at?: string;
          id?: string;
          medal_code?: string;
          name_en?: string | null;
          name_fr?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "urb_medals_user_id_fkey";
            columns: ["user_id"];
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
          avatar: string | null;
          created_at: string;
          findable: boolean;
          groups_revision: number;
          hall_of_fame_notice_seen: boolean;
          hall_of_fame_opted_out: boolean;
          handle: string;
          handle_changed_at: string;
          social_revision: number;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          avatar?: string | null;
          created_at?: string;
          findable?: boolean;
          groups_revision?: number;
          hall_of_fame_notice_seen?: boolean;
          hall_of_fame_opted_out?: boolean;
          handle: string;
          handle_changed_at?: string;
          social_revision?: number;
          user_id: string;
        };
        Update: {
          avatar?: string | null;
          created_at?: string;
          findable?: boolean;
          groups_revision?: number;
          hall_of_fame_notice_seen?: boolean;
          hall_of_fame_opted_out?: boolean;
          handle?: string;
          handle_changed_at?: string;
          social_revision?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      urb_saves: {
        Row: {
          city_id: string;
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
          city_id: string;
          client_saved_at: string;
          created_at?: string;
          envelope: NonNullable<Json>;
          format_version: number;
          revision: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          city_id?: string;
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
      urb_shipments: {
        Row: {
          created_at: string;
          from_city_id: string;
          id: string;
          lot: NonNullable<Json>;
          state: string;
          to_city_id: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          from_city_id: string;
          id: string;
          lot: NonNullable<Json>;
          state?: string;
          to_city_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          from_city_id?: string;
          id?: string;
          lot?: NonNullable<Json>;
          state?: string;
          to_city_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      urb_showcase: {
        Row: {
          citizens: number;
          created_at: string;
          envelope: NonNullable<Json>;
          format_version: number;
          ranking_at: string;
          ranking_citizens: number;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          citizens: number;
          created_at?: string;
          envelope: NonNullable<Json>;
          format_version: number;
          ranking_at?: string;
          ranking_citizens: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          citizens?: number;
          created_at?: string;
          envelope?: NonNullable<Json>;
          format_version?: number;
          ranking_at?: string;
          ranking_citizens?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "urb_showcase_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "urb_profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      urb_trade_offers: {
        Row: {
          accepted_at: string | null;
          claim_deadline: string | null;
          created_at: string;
          expires_at: string;
          id: string;
          lot: NonNullable<Json>;
          lot_claimed_at: string | null;
          payment_claimed_at: string | null;
          price: number;
          recipient_city_id: string | null;
          recipient_id: string | null;
          sender_city_id: string;
          sender_id: string | null;
          state: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          accepted_at?: string | null;
          claim_deadline?: string | null;
          created_at?: string;
          expires_at: string;
          id: string;
          lot: NonNullable<Json>;
          lot_claimed_at?: string | null;
          payment_claimed_at?: string | null;
          price: number;
          recipient_city_id?: string | null;
          recipient_id?: string | null;
          sender_city_id: string;
          sender_id?: string | null;
          state?: string;
          updated_at?: string;
        };
        Update: {
          accepted_at?: string | null;
          claim_deadline?: string | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
          lot?: NonNullable<Json>;
          lot_claimed_at?: string | null;
          payment_claimed_at?: string | null;
          price?: number;
          recipient_city_id?: string | null;
          recipient_id?: string | null;
          sender_city_id?: string;
          sender_id?: string | null;
          state?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "urb_trade_offers_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "urb_profiles";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "urb_trade_offers_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "urb_profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      urb_abandon_challenge: { Args: { p_challenge: string; p_city: string }; Returns: undefined };
      urb_accept_challenge: { Args: { p_challenge: string; p_city: string }; Returns: Json };
      urb_accept_friend_request: { Args: { p_user: string }; Returns: undefined };
      urb_accept_trade_offer: { Args: { p_city: string; p_id: string }; Returns: undefined };
      urb_add_group_members: { Args: { p_group: string; p_members: string[] }; Returns: undefined };
      urb_are_friends: { Args: { p_a: string; p_b: string }; Returns: boolean };
      urb_block_user: { Args: { p_user: string }; Returns: undefined };
      urb_bump_friends: { Args: { p_user: string }; Returns: undefined };
      urb_bump_group_members: { Args: { p_group: string }; Returns: undefined };
      urb_bump_groups: { Args: { p_user: string }; Returns: undefined };
      urb_bump_social: { Args: { p_user: string }; Returns: undefined };
      urb_cancel_shipment: { Args: { p_city: string; p_id: string }; Returns: Json };
      urb_challenge_json: {
        Args: {
          p_challenge: Omit<
            Database["public"]["Tables"]["urb_challenges"]["Row"],
            Database["public"]["Tables"]["urb_challenges"]["ComputedFields"]
          >;
        };
        Returns: Json;
      };
      urb_check_send_caps: { Args: { p_user: string }; Returns: undefined };
      urb_claim_shipment: { Args: { p_city: string; p_id: string }; Returns: Json };
      urb_claim_trade: { Args: { p_city: string; p_id: string; p_slot: string }; Returns: Json };
      urb_close_offer: { Args: { p_id: string }; Returns: undefined };
      urb_close_offers_between: { Args: { p_a: string; p_b: string }; Returns: undefined };
      urb_create_event: {
        Args: {
          p_ends_at: string;
          p_goal: Json;
          p_medal_code: string;
          p_min_citizens?: number;
          p_name_en: string;
          p_name_fr: string;
          p_name_keys: Json;
          p_starts_at: string;
        };
        Returns: string;
      };
      urb_create_group: { Args: { p_members: string[]; p_name: string }; Returns: string };
      urb_create_shipment: {
        Args: { p_from: string; p_id: string; p_lot: Json; p_to: string };
        Returns: string;
      };
      urb_create_trade_offer: {
        Args: { p_city: string; p_id: string; p_lot: Json; p_price: number; p_to: string };
        Returns: string;
      };
      urb_declare_challenge: { Args: { p_challenge: string; p_city: string }; Returns: Json };
      urb_decline_trade_offer: { Args: { p_id: string }; Returns: undefined };
      urb_delete_city_saves: { Args: { p_city_id: string }; Returns: undefined };
      urb_delete_conversation: { Args: { p_a: string; p_b: string }; Returns: undefined };
      urb_delete_group: { Args: { p_group: string }; Returns: undefined };
      urb_delete_my_saves: { Args: Record<PropertyKey, never>; Returns: undefined };
      urb_expire_challenges: { Args: Record<PropertyKey, never>; Returns: undefined };
      urb_expire_offers: { Args: Record<PropertyKey, never>; Returns: undefined };
      urb_friend_count: { Args: { p_user: string }; Returns: number };
      urb_generate_daily_challenges: { Args: Record<PropertyKey, never>; Returns: undefined };
      urb_get_showcase: { Args: { p_user: string }; Returns: Json };
      urb_group_add: {
        Args: { p_creator: string; p_group: string; p_members: string[] };
        Returns: undefined;
      };
      urb_group_creator: { Args: { p_group: string; p_user: string }; Returns: undefined };
      urb_group_member: { Args: { p_group: string; p_user: string }; Returns: undefined };
      urb_group_name: { Args: { p_name: string }; Returns: string };
      urb_hall_of_fame: { Args: Record<PropertyKey, never>; Returns: Json };
      urb_has_blocked: { Args: { p_blocked: string; p_blocker: string }; Returns: boolean };
      urb_leave_group: { Args: { p_group: string }; Returns: undefined };
      urb_list_challenges: { Args: { p_city: string }; Returns: Json };
      urb_list_cities: {
        Args: Record<PropertyKey, never>;
        Returns: {
          city_id: string;
          client_saved_at: string;
          revision: number;
        }[];
      };
      urb_list_group_messages: { Args: { p_after?: number; p_group: string }; Returns: Json };
      urb_list_groups: { Args: { p_cursor?: number }; Returns: Json };
      urb_list_messages: { Args: { p_after?: number; p_with: string }; Returns: Json };
      urb_list_saves: {
        Args: { p_city_id: string };
        Returns: {
          client_saved_at: string;
          created_at: string;
          format_version: number;
          revision: number;
          updated_at: string;
        }[];
      };
      urb_list_shipments: { Args: Record<PropertyKey, never>; Returns: Json };
      urb_list_social: { Args: { p_cursor?: number }; Returns: Json };
      urb_lock_pair: { Args: { p_a: string; p_b: string }; Returns: undefined };
      urb_lot_is_valid: { Args: { p_lot: Json }; Returns: boolean };
      urb_mark_hall_of_fame_notice_seen: { Args: Record<PropertyKey, never>; Returns: undefined };
      urb_offers_json: { Args: { p_user: string }; Returns: Json };
      urb_open_request: { Args: { p_from: string; p_to: string }; Returns: undefined };
      urb_outgoing_count: { Args: { p_user: string }; Returns: number };
      urb_publish_showcase: {
        Args: { p_citizens: number; p_envelope: Json; p_format_version: number };
        Returns: undefined;
      };
      urb_purge_inactive_anonymous_users: { Args: Record<PropertyKey, never>; Returns: undefined };
      urb_purge_old_messages: { Args: Record<PropertyKey, never>; Returns: undefined };
      urb_purge_settled_shipments: { Args: Record<PropertyKey, never>; Returns: undefined };
      urb_push_save: {
        Args: {
          p_base_revision: number;
          p_city_id: string;
          p_client_saved_at: string;
          p_envelope: Json;
          p_format_version: number;
          p_keep_previous?: boolean;
        };
        Returns: number;
      };
      urb_record_donations: { Args: { p_donations?: Json }; Returns: Json };
      urb_refuse_friend_request: { Args: { p_user: string }; Returns: undefined };
      urb_remove_friend: { Args: { p_user: string }; Returns: undefined };
      urb_remove_group_member: { Args: { p_group: string; p_user: string }; Returns: undefined };
      urb_rename_group: { Args: { p_group: string; p_name: string }; Returns: undefined };
      urb_restore_save: { Args: { p_city_id: string; p_revision: number }; Returns: number };
      urb_send_friend_request_by_email: { Args: { p_email: string }; Returns: undefined };
      urb_send_group_message: { Args: { p_body: string; p_group: string }; Returns: number };
      urb_send_message: { Args: { p_body: string; p_to: string }; Returns: number };
      urb_set_avatar: { Args: { p_avatar: string }; Returns: undefined };
      urb_set_findable: { Args: { p_findable: boolean }; Returns: undefined };
      urb_set_hall_of_fame_opt_out: { Args: { p_opted_out: boolean }; Returns: undefined };
      urb_set_handle: { Args: { p_handle: string }; Returns: undefined };
      urb_settle_acceptance: {
        Args: { p_challenge: string; p_city: string; p_user: string };
        Returns: undefined;
      };
      urb_settle_offer: { Args: { p_id: string }; Returns: undefined };
      urb_shipment_owner: { Args: Record<PropertyKey, never>; Returns: string };
      urb_showcase_allowed_ranking: {
        Args: { p_declared: number; p_previous: number; p_since: string };
        Returns: number;
      };
      urb_showcase_status: { Args: Record<PropertyKey, never>; Returns: Json };
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
