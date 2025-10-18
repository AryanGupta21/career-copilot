// /Users/aryangupta/Developer/iexcel-career-tool/src/app/onboarding/analysis/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { analyzeSkillGaps, generateLearningPlan, type SkillGap, type LearningPlan } from '@/lib/ai-service'
import { Button } from '@/components/ui/button'

export default function AnalysisPage() {
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState('Loading your data...')
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([])
  const [learningPlan, setLearningPlan] = useState<LearningPlan | null>(null)
  const [error, setError] = useState('')
  const [userData, setUserData] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    startAnalysis()
  }, [])

const startAnalysis = async () => {
  try {
    setProgress(10)
    setStep('Loading your profile...')
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/signin')
      return
    }

    // Load user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Load user skills
    const { data: skills } = await supabase
      .from('user_skills')
      .select(`
        *,
        skills (*)
      `)
      .eq('user_id', user.id)

    // Check if we have all required data
    if (!profile) {
      console.error('No profile found')
      router.push('/onboarding')
      return
    }

    if (!skills || skills.length === 0) {
      console.error('No skills found')
      router.push('/onboarding')
      return
    }

    // Set userData state for display purposes
    const currentUserData = { profile, skills, user }
    setUserData(currentUserData)
    setProgress(25)

    // Step 1: Analyze skill gaps
    setStep('Analyzing your skill gaps with AI...')
    const gaps = await analyzeSkillGaps(skills, profile.target_role)
    setSkillGaps(gaps)
    setProgress(60)

    // Step 2: Generate learning plan
    setStep('Creating your personalized learning plan...')
    const plan = await generateLearningPlan(
      profile.target_role,
      gaps,
      profile.study_hours_per_week,
      skills
    )
    setLearningPlan(plan)
    setProgress(85)

    // Step 3: Save everything - pass profile directly
    setStep('Saving your plan...')
    await saveToDatabase(user.id, plan, skills, profile) // Pass profile directly
    setProgress(100)
    
    setStep('Analysis complete!')
    setLoading(false)

  } catch (error) {
    console.error('Analysis error:', error)
    setError(error instanceof Error ? error.message : 'Something went wrong. Please try again.')
    setLoading(false)
  }
}

const saveToDatabase = async (userId: string, plan: LearningPlan, skills: any[], profile: any) => {
  try {
    console.log('=== SAVING TO DATABASE ===')
    console.log('User ID:', userId)
    console.log('Profile:', profile)
    console.log('Skills to save:', skills.length)
    console.log('Plan title:', plan.title)

    // Clear existing skills first
    console.log('Clearing existing skills...')
    const { error: deleteError } = await supabase
      .from('user_skills')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Error clearing skills:', deleteError)
    }

    // Save user skills to database with proper error handling
    console.log('Preparing skills data...')
    const userSkillsData = skills.map((skill, index) => {
      console.log(`Skill ${index + 1}:`, {
        name: skill.skills?.name || skill.name,
        id: skill.skills?.id || skill.id,
        proficiency: skill.proficiency_level || skill.proficiencyLevel,
        experience: skill.years_experience || skill.yearsExperience
      })

      return {
        user_id: userId,
        skill_id: skill.skills?.id || skill.id,
        proficiency_level: skill.proficiency_level || skill.proficiencyLevel || 3,
        years_experience: skill.years_experience || skill.yearsExperience || 0,
        last_used: null
      }
    })

    console.log('Saving skills to database...')
    const { error: skillsError } = await supabase
      .from('user_skills')
      .insert(userSkillsData) // Use insert instead of upsert

    if (skillsError) {
      console.error('Skills error details:', skillsError)
      console.error('Error code:', skillsError.code)
      console.error('Error message:', skillsError.message)
      console.error('Error hint:', skillsError.hint)
      throw new Error(`Failed to save skills: ${skillsError.message}`)
    }

    console.log('Skills saved successfully!')

    // Save learning plan
    console.log('Saving learning plan...')
    const { data: savedPlan, error: planError } = await supabase
      .from('learning_plans')
      .insert({
        user_id: userId,
        title: plan.title,
        target_role: profile.target_role,
        duration_weeks: plan.duration,
        total_hours: plan.totalHours,
        plan_data: plan,
        status: 'active'
      })
      .select()
      .single()

    if (planError) {
      console.error('Plan error details:', planError)
      throw new Error(`Failed to save plan: ${planError.message}`)
    }

    console.log('Plan saved successfully:', savedPlan.id)

    // Initialize progress tracking
    console.log('Initializing progress tracking...')
    const { error: progressError } = await supabase.from('user_progress').insert({
      user_id: userId,
      plan_id: savedPlan.id,
      completed_tasks: [],
      week_progress: {},
      overall_completion_percentage: 0
    })

    if (progressError) {
      console.error('Progress error details:', progressError)
      throw new Error(`Failed to save progress: ${progressError.message}`)
    }

    console.log('=== ALL DATA SAVED SUCCESSFULLY ===')
  } catch (error: any) {
    console.error('=== ERROR IN SAVE TO DATABASE ===')
    console.error('Error type:', typeof error)
    console.error('Error message:', error.message)
    console.error('Full error:', error)
    throw error
  }
}

  const retryAnalysis = () => {
    setError('')
    setLoading(true)
    setProgress(0)
    startAnalysis()
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Analysis Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={retryAnalysis} className="bg-blue-600 hover:bg-blue-700">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 text-2xl">🤖</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Creating Your Career Path</h1>
            <p className="text-gray-600">Our AI is analyzing your skills and creating a personalized plan</p>
          </div>
          
          <div className="space-y-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-gray-700 font-medium">{step}</p>
            <p className="text-center text-sm text-gray-500">{progress}% complete</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0] py-8">
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green-600 text-2xl">✅</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analysis Complete!</h1>
          <p className="text-gray-600">Your personalized learning plan is ready</p>
        </div>

        {/* Skill Gaps Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Skill Gap Analysis for {userData?.profile?.target_role}
          </h2>
          <div className="grid gap-4">
            {skillGaps.map((gap, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-medium text-gray-900">{gap.skill}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    gap.priority === 'high' ? 'bg-red-100 text-red-700' :
                    gap.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {gap.priority} priority
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  Current: {gap.currentLevel}/5 → Target: {gap.requiredLevel}/5
                </div>
                <p className="text-sm text-gray-700">{gap.reasoning}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Learning Plan Summary */}
        {learningPlan && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{learningPlan.title}</h2>
            <p className="text-gray-600 mb-4">{learningPlan.overview}</p>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-black rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{learningPlan.duration}</div>
                <div className="text-sm text-white">Weeks</div>
              </div>
              <div className="bg-black rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{learningPlan.totalHours}</div>
                <div className="text-sm text-white">Total Hours</div>
              </div>
              <div className="bg-black rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{skillGaps.length}</div>
                <div className="text-sm text-white">Skill Gaps</div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center">
          <Button 
            size="lg" 
            onClick={() => router.push('/dashboard')}
            className="bg-black h-12 px-8"
          >
            Start Your Learning Journey 🚀
          </Button>
        </div>
      </div>
    </div>
  )
}