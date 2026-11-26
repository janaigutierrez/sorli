/**
 * Tipus de la base de dades.
 * Es regeneren amb: npm run db:types
 * (de moment buit fins que la Fase 2 creï les primeres taules)
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
