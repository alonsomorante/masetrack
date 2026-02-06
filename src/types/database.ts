export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          phone_number: string;
          name: string;
          conversation_state: string;
          conversation_context: Json;
          last_message_at: string | null;
          created_at: string | null;
          registration_source: string | null;
          profile_image: string | null;
        };
        Insert: {
          phone_number: string;
          name: string;
          conversation_state?: string | null;
          conversation_context?: Json;
          last_message_at?: string | null;
          created_at?: string | null;
          registration_source?: string | null;
          profile_image?: string | null;
        };
        Update: {
          phone_number?: string;
          name?: string;
          conversation_state?: string | null;
          conversation_context?: Json;
          last_message_at?: string | null;
          created_at?: string | null;
          registration_source?: string | null;
          profile_image?: string | null;
        };
        Relationships: [];
      };
      exercises: {
        Row: {
          id: number;
          name: string;
          muscle_group: string;
          equipment_type: string | null;
          aliases: string[] | null;
          description: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          muscle_group: string;
          equipment_type?: string | null;
          aliases?: string[] | null;
          description?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          muscle_group?: string;
          equipment_type?: string | null;
          aliases?: string[] | null;
          description?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      custom_exercises: {
        Row: {
          id: number;
          user_phone: string;
          name: string;
          muscle_group: string;
          image_url: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          user_phone: string;
          name: string;
          muscle_group: string;
          image_url?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          user_phone?: string;
          name?: string;
          muscle_group?: string;
          image_url?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      workout_entries: {
        Row: {
          id: number;
          user_phone: string;
          exercise_id: number | null;
          custom_exercise_id: number | null;
          weight_kg: number | null;
          reps: number | null;
          sets: number | null;
          rir: number | null;
          notes: string | null;
          source: string | null;
          created_at: string | null;
          exercise_type: string | null;
          duration_seconds: number | null;
          distance_km: number | null;
          calories: number | null;
          avg_heart_rate: number | null;
        };
        Insert: {
          id?: number;
          user_phone: string;
          exercise_id?: number | null;
          custom_exercise_id?: number | null;
          weight_kg?: number | null;
          reps?: number | null;
          sets?: number | null;
          rir?: number | null;
          notes?: string | null;
          source?: string | null;
          created_at?: string | null;
          exercise_type?: string | null;
          duration_seconds?: number | null;
          distance_km?: number | null;
          calories?: number | null;
          avg_heart_rate?: number | null;
        };
        Update: {
          id?: number;
          user_phone?: string;
          exercise_id?: number | null;
          custom_exercise_id?: number | null;
          weight_kg?: number | null;
          reps?: number | null;
          sets?: number | null;
          rir?: number | null;
          notes?: string | null;
          source?: string | null;
          created_at?: string | null;
          exercise_type?: string | null;
          duration_seconds?: number | null;
          distance_km?: number | null;
          calories?: number | null;
          avg_heart_rate?: number | null;
        };
        Relationships: [];
      };
      verification_codes: {
        Row: {
          phone_number: string;
          code: string;
          expires_at: string;
          created_at: string | null;
        };
        Insert: {
          phone_number: string;
          code: string;
          expires_at: string;
          created_at?: string | null;
        };
        Update: {
          phone_number?: string;
          code?: string;
          expires_at?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      admin_users: {
        Row: {
          username: string;
          password_hash: string;
          created_at: string | null;
        };
        Insert: {
          username: string;
          password_hash: string;
          created_at?: string | null;
        };
        Update: {
          username?: string;
          password_hash?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
