export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      urb_saves: {
        Row: {
          client_saved_at: string
          created_at: string
          envelope: Json
          format_version: number
          revision: number
          updated_at: string
          user_id: string
        }
        Insert: {
          client_saved_at: string
          created_at?: string
          envelope: Json
          format_version: number
          revision: number
          updated_at?: string
          user_id: string
        }
        Update: {
          client_saved_at?: string
          created_at?: string
          envelope?: Json
          format_version?: number
          revision?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      urb_delete_my_saves: {
        Args: never
        Returns: undefined
      }
      urb_list_saves: {
        Args: never
        Returns: {
          client_saved_at: string
          created_at: string
          format_version: number
          revision: number
          updated_at: string
        }[]
      }
      urb_purge_inactive_anonymous_users: {
        Args: never
        Returns: undefined
      }
      urb_push_save: {
        Args: {
          p_base_revision: number
          p_client_saved_at: string
          p_envelope: Json
          p_format_version: number
          p_keep_previous?: boolean
        }
        Returns: number
      }
      urb_restore_save: {
        Args: { p_revision: number }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
