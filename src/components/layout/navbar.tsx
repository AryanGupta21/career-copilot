// /Users/aryangupta/Developer/iexcel-career-tool/src/components/layout/navbar.tsx

'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { User } from '@supabase/supabase-js'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-blue-600">
            iExcel
          </Link>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link href="/onboarding" className="text-gray-700 hover:text-gray-900">
                  Profile
                </Link>
                <Button variant="outline" onClick={handleSignOut} size="sm">
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/signin" className="text-gray-700 hover:text-gray-900">
                  Sign In
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}