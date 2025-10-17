'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { User } from '@supabase/supabase-js'
import { ArrowRight } from 'lucide-react'

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
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center ml-4">
              <Link href="/" className="flex items-center space-x-3 group">
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Job Portal.AI</span>
              </Link>
            </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link href="/onboarding" className="text-gray-700 hover:text-gray-900">
                  Profile
                </Link>
                <Button 
                  variant="outline" 
                  onClick={handleSignOut} 
                  size="sm"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/signin" className="text-gray-700 hover:text-gray-900">
                  Sign In
                </Link>
                <Link href="/auth/signup">
                  <Button 
                    size="sm" 
                    className="bg-gray-900 text-white hover:bg-gray-800 rounded-md flex items-center"
                  >
                    Get Started
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}