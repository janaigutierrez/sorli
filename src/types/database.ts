/**
 * Tipus de la base de dades (schema public).
 * Generat a partir de Supabase. Per regenerar: `npm run db:types`.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.18" };
  public: {
    Tables: {
      comments: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          id: string;
          parent_id: string | null;
          post_id: string;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          body: string;
          created_at?: string;
          id?: string;
          parent_id?: string | null;
          post_id: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
          parent_id?: string | null;
          post_id?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "comments_author_id_fkey"; columns: ["author_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "comments_parent_id_fkey"; columns: ["parent_id"]; isOneToOne: false; referencedRelation: "comments"; referencedColumns: ["id"] },
          { foreignKeyName: "comments_post_id_fkey"; columns: ["post_id"]; isOneToOne: false; referencedRelation: "posts"; referencedColumns: ["id"] },
        ];
      };
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
      likes: {
        Row: {
          created_at: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          { foreignKeyName: "likes_post_id_fkey"; columns: ["post_id"]; isOneToOne: false; referencedRelation: "posts"; referencedColumns: ["id"] },
          { foreignKeyName: "likes_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      notifications: {
        Row: {
          actor_id: string;
          comment_id: string | null;
          created_at: string;
          id: string;
          post_id: string | null;
          read_at: string | null;
          recipient_id: string;
          type: Database["public"]["Enums"]["notification_type"];
        };
        Insert: {
          actor_id: string;
          comment_id?: string | null;
          created_at?: string;
          id?: string;
          post_id?: string | null;
          read_at?: string | null;
          recipient_id: string;
          type: Database["public"]["Enums"]["notification_type"];
        };
        Update: {
          actor_id?: string;
          comment_id?: string | null;
          created_at?: string;
          id?: string;
          post_id?: string | null;
          read_at?: string | null;
          recipient_id?: string;
          type?: Database["public"]["Enums"]["notification_type"];
        };
        Relationships: [
          { foreignKeyName: "notifications_actor_id_fkey"; columns: ["actor_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "notifications_comment_id_fkey"; columns: ["comment_id"]; isOneToOne: false; referencedRelation: "comments"; referencedColumns: ["id"] },
          { foreignKeyName: "notifications_post_id_fkey"; columns: ["post_id"]; isOneToOne: false; referencedRelation: "posts"; referencedColumns: ["id"] },
          { foreignKeyName: "notifications_recipient_id_fkey"; columns: ["recipient_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      photos: {
        Row: {
          created_at: string;
          id: string;
          owner_id: string;
          storage_path: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          owner_id: string;
          storage_path: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          owner_id?: string;
          storage_path?: string;
        };
        Relationships: [
          { foreignKeyName: "photos_owner_id_fkey"; columns: ["owner_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      post_photos: {
        Row: {
          photo_id: string;
          position: number;
          post_id: string;
        };
        Insert: {
          photo_id: string;
          position?: number;
          post_id: string;
        };
        Update: {
          photo_id?: string;
          position?: number;
          post_id?: string;
        };
        Relationships: [
          { foreignKeyName: "post_photos_photo_id_fkey"; columns: ["photo_id"]; isOneToOne: false; referencedRelation: "photos"; referencedColumns: ["id"] },
          { foreignKeyName: "post_photos_post_id_fkey"; columns: ["post_id"]; isOneToOne: false; referencedRelation: "posts"; referencedColumns: ["id"] },
        ];
      };
      posts: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          id: string;
          updated_at: string;
          wall_owner_id: string;
        };
        Insert: {
          author_id: string;
          body?: string;
          created_at?: string;
          id?: string;
          updated_at?: string;
          wall_owner_id: string;
        };
        Update: {
          author_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
          updated_at?: string;
          wall_owner_id?: string;
        };
        Relationships: [
          { foreignKeyName: "posts_author_id_fkey"; columns: ["author_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "posts_wall_owner_id_fkey"; columns: ["wall_owner_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
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
          { foreignKeyName: "profiles_invitation_id_fkey"; columns: ["invitation_id"]; isOneToOne: false; referencedRelation: "invitations"; referencedColumns: ["id"] },
        ];
      };
      playlists: {
        Row: {
          cover_url: string | null;
          created_at: string;
          description: string | null;
          id: string;
          owner_id: string;
          spotify_url: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          owner_id: string;
          spotify_url: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          owner_id?: string;
          spotify_url?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [{ foreignKeyName: "playlists_owner_id_fkey"; columns: ["owner_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
      songs: {
        Row: {
          artist: string;
          cover_path: string | null;
          cover_url: string | null;
          created_at: string;
          id: string;
          owner_id: string;
          title: string;
          updated_at: string;
          url: string;
        };
        Insert: {
          artist: string;
          cover_path?: string | null;
          cover_url?: string | null;
          created_at?: string;
          id?: string;
          owner_id: string;
          title: string;
          updated_at?: string;
          url: string;
        };
        Update: {
          artist?: string;
          cover_path?: string | null;
          cover_url?: string | null;
          created_at?: string;
          id?: string;
          owner_id?: string;
          title?: string;
          updated_at?: string;
          url?: string;
        };
        Relationships: [{ foreignKeyName: "songs_owner_id_fkey"; columns: ["owner_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
      wishlist_items: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          image_path: string | null;
          name: string;
          owner_id: string;
          updated_at: string;
          url: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image_path?: string | null;
          name: string;
          owner_id: string;
          updated_at?: string;
          url?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image_path?: string | null;
          name?: string;
          owner_id?: string;
          updated_at?: string;
          url?: string | null;
        };
        Relationships: [{ foreignKeyName: "wishlist_items_owner_id_fkey"; columns: ["owner_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      check_invitation: {
        Args: { p_email?: string; p_token: string; p_username?: string };
        Returns: string;
      };
      create_post: {
        Args: { p_body: string; p_photo_paths?: string[]; p_wall_owner_id: string };
        Returns: string;
      };
      delete_my_account: { Args: never; Returns: undefined };
    };
    Enums: {
      member_role: "admin" | "member";
      member_status: "active" | "suspended";
      notification_type: "wall_post" | "comment" | "reply" | "like";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
export type Profile = Tables<"profiles">;
