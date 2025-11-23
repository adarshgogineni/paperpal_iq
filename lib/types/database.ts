export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Audience =
  | "elementary"
  | "high_school"
  | "undergraduate"
  | "graduate"
  | "expert"

export type DocumentStatus =
  | "uploaded"
  | "processing"
  | "completed"
  | "error"

export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string
          user_id: string
          title: string
          file_path: string
          file_size: number | null
          mime_type: string | null
          status: DocumentStatus
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          file_path: string
          file_size?: number | null
          mime_type?: string | null
          status?: DocumentStatus
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          file_path?: string
          file_size?: number | null
          mime_type?: string | null
          status?: DocumentStatus
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      summaries: {
        Row: {
          id: string
          document_id: string
          audience: Audience
          summary_text: string
          tokens_used: number | null
          model_used: string | null
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          audience: Audience
          summary_text: string
          tokens_used?: number | null
          model_used?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          audience?: Audience
          summary_text?: string
          tokens_used?: number | null
          model_used?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
