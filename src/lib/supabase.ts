// /Users/aryangupta/Developer/iexcel-career-tool/src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions
export interface UserProfile {
  id: string
  full_name: string | null
  current_role: string | null
  target_role: string | null
  location: string | null
  study_hours_per_week: number
}

export interface Skill {
  id: number
  name: string
  category: string
}

export interface UserSkill {
  id: string
  skill_id: number
  proficiency_level: number
  years_experience: number
  last_used: string | null
  skills: Skill
}