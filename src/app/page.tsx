// /Users/aryangupta/Developer/iexcel-career-tool/src/app/page.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-6">
            <span className="text-white text-3xl font-bold">iE</span>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Your Career <span className="text-blue-600">GPS</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Get a personalized 6-12 week learning plan to land your dream job. 
            AI-powered skill gap analysis, curated resources, and job matching.
          </p>
          
          <div className="flex justify-center space-x-4 mb-12">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 h-12 px-8 text-lg">
                Get Started Free
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button size="lg" variant="outline" className="h-12 px-8 text-lg border-gray-300">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Set Your Goal</h3>
              <p className="text-gray-600">Tell us your target role and current skills</p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Get Your Plan</h3>
              <p className="text-gray-600">AI creates a personalized learning roadmap</p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Land Your Job</h3>
              <p className="text-gray-600">Track progress and apply to matching opportunities</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}