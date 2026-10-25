export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          business_name: string
          logo_url: string | null
          brand_colour: string
          google_review_url: string
          google_review_url_verified: boolean
          google_review_url_updated_at: string | null
          google_review_url_updated_by: string | null
          owner_whatsapp: string | null
          owner_email: string | null
          alert_threshold: number
          webhook_url: string | null
          status: string
          location_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          business_name: string
          logo_url?: string | null
          brand_colour?: string
          google_review_url: string
          google_review_url_verified?: boolean
          google_review_url_updated_at?: string | null
          google_review_url_updated_by?: string | null
          owner_whatsapp?: string | null
          owner_email?: string | null
          alert_threshold?: number
          webhook_url?: string | null
          status?: string
          location_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_name?: string
          logo_url?: string | null
          brand_colour?: string
          google_review_url?: string
          google_review_url_verified?: boolean
          google_review_url_updated_at?: string | null
          google_review_url_updated_by?: string | null
          owner_whatsapp?: string | null
          owner_email?: string | null
          alert_threshold?: number
          webhook_url?: string | null
          status?: string
          location_id?: string | null
          created_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          client_id: string
          name: string
          phone: string
          rating: number
          comment: string | null
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          phone: string
          rating: number
          comment?: string | null
          source?: string
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          phone?: string
          rating?: number
          comment?: string | null
          source?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          role: string
          client_id: string | null
          disabled: boolean
          invited_at: string | null
          last_invited_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          role?: string
          client_id?: string | null
          disabled?: boolean
          invited_at?: string | null
          last_invited_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          role?: string
          client_id?: string | null
          disabled?: boolean
          invited_at?: string | null
          last_invited_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notification_settings: {
        Row: {
          id: string
          scope: string
          client_id: string | null
          recipient_email: string | null
          cc_emails: string[]
          enabled: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          scope: string
          client_id?: string | null
          recipient_email?: string | null
          cc_emails?: string[]
          enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          scope?: string
          client_id?: string | null
          recipient_email?: string | null
          cc_emails?: string[]
          enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
      }
      email_log: {
        Row: {
          id: string
          submission_id: string | null
          client_id: string | null
          kind: string
          recipients: string[]
          cc: string[]
          subject: string | null
          status: string
          provider_id: string | null
          error: string | null
          created_at: string
        }
        Insert: {
          id?: string
          submission_id?: string | null
          client_id?: string | null
          kind?: string
          recipients?: string[]
          cc?: string[]
          subject?: string | null
          status: string
          provider_id?: string | null
          error?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          submission_id?: string | null
          client_id?: string | null
          kind?: string
          recipients?: string[]
          cc?: string[]
          subject?: string | null
          status?: string
          provider_id?: string | null
          error?: string | null
          created_at?: string
        }
      }
    }
  }
}
