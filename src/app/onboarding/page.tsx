// /Users/aryangupta/Developer/iexcel-career-tool/src/app/onboarding/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import SkillsStep from '@/components/onboarding/skills-step'

type OnboardingStep = 'profile' | 'skills' | 'analysis'

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('profile')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileData, setProfileData] = useState({
    fullName: '',
    currentRole: '',
    targetRole: '',
    location: '',
    studyHours: 10
  })
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/signin')
      return
    }

    setUser(user)

    // Check if profile exists
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profile) {
      setProfileData({
        fullName: profile.full_name || '',
        currentRole: profile.current_role || '',
        targetRole: profile.target_role || '',
        location: profile.location || '',
        studyHours: profile.study_hours_per_week || 10
      })
      
      // Check if user has skills, if so skip to skills step
      const { data: skills } = await supabase
        .from('user_skills')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      if (skills && skills.length > 0) {
        setCurrentStep('skills')
      }
    }

    setLoading(false)
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)

    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        full_name: profileData.fullName,
        current_role: profileData.currentRole,
        target_role: profileData.targetRole,
        location: profileData.location,
        study_hours_per_week: profileData.studyHours,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error saving profile:', error)
      alert('Error saving profile. Please try again.')
    } else {
      setCurrentStep('skills')
    }

    setSaving(false)
  }

  const handleSkillsComplete = async (skills: any[]) => {
  if (!user || skills.length === 0) return

  console.log('Saving skills for user:', user.id)
  console.log('Skills to save:', skills)

  try {
    // First, let's check if user profile exists
    const { data: profileCheck } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    console.log('Profile check:', profileCheck)

    if (!profileCheck) {
      alert('User profile not found. Please complete the profile step first.')
      return
    }

    // Clear existing skills first to avoid conflicts
    const { error: deleteError } = await supabase
      .from('user_skills')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error clearing existing skills:', deleteError)
    }

    // Prepare skills data with better error handling
    const userSkillsData = skills.map(skill => ({
      user_id: user.id,
      skill_id: skill.id,
      proficiency_level: skill.proficiencyLevel,
      years_experience: skill.yearsExperience || 0,
      last_used: null // Set to null for now
    }))

    console.log('Prepared skills data:', userSkillsData)

    // Insert skills one by one to identify which one fails
    for (let i = 0; i < userSkillsData.length; i++) {
      const skillData = userSkillsData[i]
      console.log(`Inserting skill ${i + 1}:`, skillData)
      
      const { error: insertError } = await supabase
        .from('user_skills')
        .insert(skillData)

      if (insertError) {
        console.error(`Error inserting skill ${i + 1}:`, insertError)
        alert(`Error saving skill: ${skills[i].name}. Error: ${insertError.message}`)
        return
      }
    }

    console.log('All skills saved successfully!')
    
    // Redirect to analysis
    router.push('/onboarding/analysis')

  } catch (error) {
    console.error('Unexpected error in handleSkillsComplete:', error)
    alert('Unexpected error saving skills. Please try again.')
  }
}

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      {/* Progress Indicator */}
      <div className="max-w-4xl mx-auto pt-8 px-4">
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'profile' ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'
            }`}>
              1
            </div>
            <div className="w-16 h-1 bg-gray-200">
              <div className={`h-1 bg-blue-600 ${currentStep !== 'profile' ? 'w-full' : 'w-0'} transition-all`} />
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'skills' ? 'bg-blue-600 text-white' : 
              currentStep === 'profile' ? 'bg-gray-200 text-gray-500' : 'bg-green-500 text-white'
            }`}>
              2
            </div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 'profile' && (
        <div className="max-w-2xl mx-auto px-4 pb-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome!</h1>
            <p className="text-gray-600">Let's get you started on your career journey</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div>
                <Label htmlFor="fullName" className="text-gray-700 font-medium">Full Name *</Label>
                <Input
                  id="fullName"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                  className="mt-2 h-12 bg-white text-gray-800"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <Label htmlFor="currentRole" className="text-gray-700 font-medium">Current Role *</Label>
                <Input
                  id="currentRole"
                  value={profileData.currentRole}
                  onChange={(e) => setProfileData(prev => ({ ...prev, currentRole: e.target.value }))}
                  required
                  className="mt-2 h-12  bg-white text-gray-800"
                  placeholder="e.g. Junior Developer, Student, Career Changer"
                />
              </div>

              <div>
                <Label htmlFor="targetRole" className="text-gray-700 font-medium">Target Role *</Label>
                <Input
                  id="targetRole"
                  value={profileData.targetRole}
                  onChange={(e) => setProfileData(prev => ({ ...prev, targetRole: e.target.value }))}
                  required
                  className="mt-2 h-12  bg-white text-gray-800"
                  placeholder="e.g. Senior Full-Stack Developer, Data Scientist"
                />
              </div>

              <div>
                <Label htmlFor="location" className="text-gray-700 font-medium">Location</Label>
                <Input
                  id="location"
                  value={profileData.location}
                  onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                  className="mt-2 h-12  bg-white text-gray-800"
                  placeholder="e.g. New York, NY or Remote"
                />
              </div>

              <div>
                <Label htmlFor="studyHours" className="text-gray-700 font-medium">Study Hours Per Week *</Label>
                <Input
                  id="studyHours"
                  type="number"
                  min="1"
                  max="40"
                  value={profileData.studyHours}
                  onChange={(e) => setProfileData(prev => ({ ...prev, studyHours: parseInt(e.target.value) }))}
                  required
                  className="mt-2 h-12  bg-white text-gray-800"
                />
                <p className="text-sm text-gray-500 mt-2">
                  How many hours can you dedicate to learning each week?
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg" 
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Next: Add Your Skills'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {currentStep === 'skills' && (
        <SkillsStep onComplete={handleSkillsComplete} />
      )}
    </div>
  )
}