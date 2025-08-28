// /Users/aryangupta/Developer/iexcel-career-tool/src/app/jobs/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { searchJobs, calculateJobMatch, type JobPosting } from '@/lib/jobs-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MapPin, DollarSign, Calendar, ExternalLink, Target } from 'lucide-react'

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [userSkills, setUserSkills] = useState<string[]>([])
  const [targetRole, setTargetRole] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    loadUserDataAndJobs()
  }, [])

  const loadUserDataAndJobs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // Load user skills
      const { data: skillsData } = await supabase
        .from('user_skills')
        .select(`
          *,
          skills (name)
        `)
        .eq('user_id', user.id)

      if (skillsData) {
        const skillNames = skillsData.map(s => s.skills.name)
        setUserSkills(skillNames)
      }

      const role = profile?.target_role || ''
      setTargetRole(role)
      setSearchTerm(role)
      setLocation(profile?.location || '')

      // Auto-search for jobs based on target role
      if (role) {
        await performJobSearch(role, profile?.location || '')
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading user data:', error)
      setLoading(false)
    }
  }

  const performJobSearch = async (searchRole: string, searchLocation: string = '') => {
    setSearching(true)
    try {
      const jobResults = await searchJobs(searchRole, searchLocation, 20)
      
      // Calculate match scores
      const jobsWithScores = jobResults.map(job => ({
        ...job,
        matchScore: calculateJobMatch(job, userSkills)
      }))

      // Sort by match score
      jobsWithScores.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      
      setJobs(jobsWithScores)
    } catch (error) {
      console.error('Error searching jobs:', error)
    }
    setSearching(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      performJobSearch(searchTerm.trim(), location.trim())
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-gray-600">Loading job opportunities...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Opportunities</h1>
          <p className="text-gray-600">
            Jobs matched to your skills and career goals as a {targetRole}
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <form onSubmit={handleSearch} className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
              <Input
                type="text"
                placeholder="e.g. Data Scientist, Software Engineer"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <Input
                type="text"
                placeholder="e.g. London, Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="flex items-end">
              <Button 
                type="submit" 
                disabled={searching}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700"
              >
                {searching ? 'Searching...' : 'Search Jobs'}
              </Button>
            </div>
          </form>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600">
            Found {jobs.length} jobs {searchTerm && `for "${searchTerm}"`}
            {userSkills.length > 0 && ` • Matched against your ${userSkills.length} skills`}
          </p>
        </div>

        {/* Job Listings */}
        {jobs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Jobs Found</h3>
            <p className="text-gray-600 mb-6">
              Try searching for different keywords or check back later for new opportunities.
            </p>
            <Button onClick={() => performJobSearch(targetRole)}>
              Search for {targetRole} roles
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
                {/* Job Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                    <div className="flex items-center flex-wrap gap-4 text-gray-600">
                      <span className="font-medium">{job.company}</span>
                      {job.location && (
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {job.location}
                        </span>
                      )}
                      {job.salary && (
                        <span className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {job.salary}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Match Score */}
                  <div className="text-right">
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${
                      (job.matchScore || 0) >= 70 ? 'bg-green-100 text-green-800' :
                      (job.matchScore || 0) >= 40 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {job.matchScore || 0}% match
                    </div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(job.postedDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Job Description */}
                <div className="mb-4">
                  <p className="text-gray-700 line-clamp-3">
                    {job.description}
                  </p>
                </div>

                {/* Required Skills */}
                {job.requirements && job.requirements.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Required Skills:</h4>
                    <div className="flex flex-wrap gap-2">
                      {job.requirements.map((req, i) => {
                        const hasSkill = userSkills.some(skill => 
                          skill.toLowerCase() === req.toLowerCase()
                        )
                        return (
                          <span
                            key={i}
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              hasSkill 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {req}
                            {hasSkill && ' ✓'}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    via {job.source}
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <a href={job.url} target="_blank" rel="noopener noreferrer">
                      View Job <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}