/**
 * Tipus de la base de dades (schema public).
 * Generat amb Supabase: `npm run db:types` (requereix `supabase login`).
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      invitations: {
        Row: {
          created_at: string;
          created_by: string | null;
          email: string | null;
          expires_at: string;
          id: string;
          note: string | null;
          revoked_at: string | null;
          role: Database["public"]["Enums"]["member_role"];
          token_hash: string;
          updated_at: string;
          used_at: string | null;
          used_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          expires_at?: string;
          id?: string;
          note?: string | null;
          revoked_at?: string | null;
          role?: Database["public"]["Enums"]["member_role"];
          token_hash: string;
          updated_at?: string;
          used_at?: string | null;
          used_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          expires_at?: string;
          id?: string;
          note?: string | null;
          revoked_at?: string | null;
          role?: Database["public"]["Enums"]["member_role"];
          token_hash?: string;
          updated_at?: string;
          used_at?: string | null;
          used_by?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_path: string | null;
          bio: string | null;
          birthday: string | null;
          city: string | null;
          cover_path: string | null;
          created_at: string;
          display_name: string;
          id: string;
          invitation_id: string | null;
          role: Database["public"]["Enums"]["member_role"];
          status: Database["public"]["Enums"]["member_status"];
          updated_at: string;
          username: string;
        };
        Insert: {
          avatar_path?: string | null;
          bio?: string | null;
          birthday?: string | null;
          city?: string | null;
          cover_path?: string | null;
          created_at?: string;
          display_name: string;
          id: string;
          invitation_id?: string | null;
          role?: Database["public"]["Enums"]["member_role"];
          status?: Database["public"]["Enums"]["member_status"];
          updated_at?: string;
          username: string;
        };
        Update: {
          avatar_path?: string | null;
          bio?: string | null;
          birthday?: string | null;
          city?: string | null;
          cover_path?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          invitation_id?: string | null;
          role?: Database["public"]["Enums"]["member_role"];
          status?: Database["public"]["Enums"]["member_status"];
          updated_at?: string;
          username?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_invitation_id_fkey";
            columns: ["invitation_id"];
            isOneToOne: false;
            referencedRelation: "invitations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      check_invitation: {
        Args: { p_email?: string; p_token: string; p_username?: string };
        Returns: string;
      };
    };
    Enums: {
      member_role: "admin" | "member";
      member_status: "active" | "suspended";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
export type Profile = Tables<"profiles">;
