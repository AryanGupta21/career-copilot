// Client-side service - NO GoogleGenAI imports here!
// /Users/aryangupta/Developer/iexcel-career-tool/src/lib/ai-service.ts

export interface SkillGap {
  skill: string
  currentLevel: number
  requiredLevel: number
  priority: 'high' | 'medium' | 'low'
  reasoning: string
  learningPath: string
}

export interface LearningWeek {
  week: number
  focus: string[]
  tasks: {
    id: string
    title: string
    description: string
    estimatedHours: number
    type: 'reading' | 'practice' | 'project' | 'exercise'
    resources: string[]
  }[]
  milestone: string
  totalHours: number
}

export interface LearningPlan {
  title: string
  overview: string
  duration: number
  totalHours: number
  skillGaps: SkillGap[]
  weeks: LearningWeek[]
  finalProject: string
}

export async function analyzeSkillGaps(
  currentSkills: any[],
  targetRole: string
): Promise<SkillGap[]> {
  console.log('Starting skill gap analysis...')
  console.log('Target role:', targetRole)
  console.log('Current skills:', currentSkills.length)

  const response = await fetch('/api/analyze-gaps', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      currentSkills,
      targetRole
    })
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error('API Error:', errorData)
    throw new Error(errorData.error || 'Failed to analyze skill gaps')
  }

  const data = await response.json()
  console.log('Skill gaps analysis complete:', data.skillGaps.length, 'gaps found')
  
  return data.skillGaps
}

export async function generateLearningPlan(
  targetRole: string,
  skillGaps: SkillGap[],
  studyHoursPerWeek: number,
  currentSkills: any[]
): Promise<LearningPlan> {
  console.log('Starting learning plan generation...')

  const response = await fetch('/api/generate-plan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      targetRole,
      skillGaps,
      studyHoursPerWeek,
      currentSkills
    })
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error('Plan Generation Error:', errorData)
    throw new Error(errorData.error || 'Failed to generate learning plan')
  }

  const data = await response.json()
  console.log('Learning plan generated successfully:', data.plan.duration, 'weeks')
  
  return data.plan
}

export async function testGeminiConnection(): Promise<boolean> {
  try {
    const response = await fetch('/api/test-gemini')
    const data = await response.json()
    return data.success === true
  } catch (error) {
    console.error('Connection test failed:', error)
    return false
  }
}