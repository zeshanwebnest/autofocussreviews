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
    }
  }
}
