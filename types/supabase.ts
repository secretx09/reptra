export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          username: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          username?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          username?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      cloud_records: {
        Row: {
          id: string;
          user_id: string;
          record_type:
            | 'workout'
            | 'routine'
            | 'custom_exercise'
            | 'progress_photo'
            | 'settings'
            | 'favorite_exercise';
          local_id: string;
          payload: Json;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          record_type:
            | 'workout'
            | 'routine'
            | 'custom_exercise'
            | 'progress_photo'
            | 'settings'
            | 'favorite_exercise';
          local_id: string;
          payload: Json;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          payload?: Json;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
