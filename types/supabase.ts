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
          bio: string | null;
          display_name: string | null;
          training_focus: string | null;
          username: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          bio?: string | null;
          display_name?: string | null;
          training_focus?: string | null;
          username?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          bio?: string | null;
          display_name?: string | null;
          training_focus?: string | null;
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
            | 'training_split'
            | 'favorite_exercise'
            | 'fitness_goal'
            | 'body_measurement';
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
            | 'training_split'
            | 'favorite_exercise'
            | 'fitness_goal'
            | 'body_measurement';
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
