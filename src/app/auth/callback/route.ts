///Users/aryangupta/Developer/iexcel-career-tool/src/app/auth/callback/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect to onboarding for new users or dashboard for existing users
  return NextResponse.redirect(new URL('/onboarding', request.url))
}