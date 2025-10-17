// /Users/aryangupta/Developer/iexcel-career-tool/src/app/page.tsx
'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f0' }}>
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center">
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in-up">
            Your Career <span className="text-gray-700 bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">GPS</span>
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
            Get a personalized 6-12 week learning plan to land your dream job. 
            AI-powered skill gap analysis, curated resources, and job matching.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12 animate-fade-in-up animation-delay-400">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-white h-12 px-8 text-lg rounded-md transform hover:scale-105 transition-all duration-300 hover:shadow-xl group w-full sm:w-auto">
                Get Started 
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button size="lg" variant="outline" className="h-12 px-8 text-lg border-gray-700 text-gray-700 hover:bg-white rounded-md transform hover:scale-105 transition-all duration-300 hover:shadow-lg backdrop-blur-sm w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Full width white section */}
      <div className="w-full bg-white py-16 shadow-lg relative overflow-hidden">
        
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up">How It Works</h2>
          <p className="text-gray-600 mb-12 animate-fade-in-up animation-delay-200">Simple steps to accelerate your career</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#f5f5f0] p-8 rounded-2xl shadow-sm border border-gray-100 transform hover:scale-105 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group animate-fade-in-up animation-delay-300">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md group-hover:shadow-lg transition-shadow duration-300 group-hover:scale-110 transform">
                <span className="text-3xl transform group-hover:scale-110 transition-transform duration-300">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-gray-700 transition-colors duration-300">1. Set Your Goal</h3>
              <p className="text-gray-700 group-hover:text-gray-600 transition-colors duration-300">Tell us your target role and current skills</p>
            </div>

            <div className="bg-[#f5f5f0] p-8 rounded-2xl shadow-sm border border-gray-100 transform hover:scale-105 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group animate-fade-in-up animation-delay-500">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md group-hover:shadow-lg transition-shadow duration-300 group-hover:scale-110 transform">
                <span className="text-3xl transform group-hover:scale-110 transition-transform duration-300">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-gray-700 transition-colors duration-300">2. Get Your Plan</h3>
              <p className="text-gray-700 group-hover:text-gray-600 transition-colors duration-300">AI creates a personalized learning roadmap</p>
            </div>
            
            <div className="bg-[#f5f5f0] p-8 rounded-2xl shadow-sm border border-gray-100 transform hover:scale-105 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group animate-fade-in-up animation-delay-700">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md group-hover:shadow-lg transition-shadow duration-300 group-hover:scale-110 transform">
                <span className="text-3xl transform group-hover:scale-110 transition-transform duration-300">🚀</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-gray-700 transition-colors duration-300">3. Land Your Job</h3>
              <p className="text-gray-700 group-hover:text-gray-600 transition-colors duration-300">Track progress and apply to matching opportunities</p>
            </div>
          </div>
        </div>
        
        {/* Floating elements for visual interest */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-gray-100 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-gray-200 rounded-full opacity-10 animate-pulse animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-gray-150 rounded-full opacity-5 animate-bounce animation-delay-2000"></div>
      </div>
      
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
        }
        
        .animation-delay-300 {
          animation-delay: 0.3s;
          opacity: 0;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
          opacity: 0;
        }
        
        .animation-delay-500 {
          animation-delay: 0.5s;
          opacity: 0;
        }
        
        .animation-delay-700 {
          animation-delay: 0.7s;
          opacity: 0;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  )
}