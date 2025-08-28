// REPLACE /src/lib/jobs-service.ts with this (URL fix on line 20):

export interface JobPosting {
  id: string
  title: string
  company: string
  location: string
  salary?: string
  description: string
  requirements: string[]
  url: string
  source: string
  postedDate: string
  matchScore?: number
}

export async function searchJobs(
  targetRole: string,
  location: string = '',
  limit: number = 20
): Promise<JobPosting[]> {
  try {
    // FIX: Changed '/api/jobs/search' to '/api/job/search' (singular)
    const response = await fetch('/api/job/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keywords: targetRole,
        location,
        limit
      })
    })

    if (!response.ok) {
      throw new Error('Failed to fetch jobs')
    }

    const data = await response.json()
    return data.jobs || []
  } catch (error) {
    console.error('Error searching jobs:', error)
    return []
  }
}

export function calculateJobMatch(
  job: JobPosting,
  userSkills: string[]
): number {
  if (job.requirements.length === 0) return 50

  const userSkillsLower = userSkills.map(s => s.toLowerCase())
  const matchedRequirements = job.requirements.filter(req =>
    userSkillsLower.some(skill => req.toLowerCase().includes(skill))
  )

  return Math.round((matchedRequirements.length / job.requirements.length) * 100)
}

function extractSkillsFromDescription(description: string): string[] {
  const skillKeywords = [
    'JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'AWS', 'Docker',
    'Git', 'TypeScript', 'MongoDB', 'PostgreSQL', 'Redis', 'Kubernetes',
    'Angular', 'Vue.js', 'Express', 'Django', 'Flask', 'REST API',
    'GraphQL', 'HTML', 'CSS', 'SASS', 'Machine Learning', 'Data Science',
    'Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'R',
    'Tableau', 'Power BI', 'Excel', 'Statistics', 'Linear Algebra'
  ]

  return skillKeywords.filter(skill => 
    description.toLowerCase().includes(skill.toLowerCase())
  )
}