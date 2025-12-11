import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Client for browser usage
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server-side operations (only if service key is available)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          phone_number: string
          first_name: string
          last_name: string
          role: 'user' | 'admin' | 'superadmin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          phone_number: string
          first_name: string
          last_name: string
          role?: 'user' | 'admin' | 'superadmin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          phone_number?: string
          first_name?: string
          last_name?: string
          role?: 'user' | 'admin' | 'superadmin'
          updated_at?: string
        }
      }
      loans: {
        Row: {
          id: string
          user_id: string
          loan_amount: number
          duration_months: number
          interest_rate: number
          monthly_payment: number
          total_amount: number
          status: 'Pending Approval' | 'Approved' | 'In Repayment' | 'Completed' | 'Rejected'
          application_date: string
          approval_date: string | null
          first_payment_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          loan_amount: number
          duration_months: number
          interest_rate?: number
          monthly_payment: number
          total_amount: number
          status?: 'Pending Approval' | 'Approved' | 'In Repayment' | 'Completed' | 'Rejected'
          application_date?: string
          approval_date?: string | null
          first_payment_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          loan_amount?: number
          duration_months?: number
          interest_rate?: number
          monthly_payment?: number
          total_amount?: number
          status?: 'Pending Approval' | 'Approved' | 'In Repayment' | 'Completed' | 'Rejected'
          approval_date?: string | null
          first_payment_date?: string | null
          updated_at?: string
        }
      }
    }
  }
}