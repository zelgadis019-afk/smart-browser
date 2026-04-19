import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      pages: {
        Row: {
          id: string
          user_id: string
          url: string | null
          title: string
          content: string
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['pages']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['pages']['Insert']>
      }
      summaries: {
        Row: {
          id: string
          page_id: string
          type: 'tldr' | 'bullets' | 'eli5'
          content: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['summaries']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['summaries']['Insert']>
      }
      chats: {
        Row: {
          id: string
          page_id: string
          user_id: string
          message: string
          role: 'user' | 'assistant'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['chats']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['chats']['Insert']>
      }
      extracted_data: {
        Row: {
          id: string
          page_id: string
          type: 'emails' | 'phones' | 'tables' | 'links'
          data: Record<string, unknown>
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['extracted_data']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['extracted_data']['Insert']>
      }
    }
  }
}
