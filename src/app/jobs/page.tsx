// /Users/aryangupta/Developer/iexcel-career-tool/src/app/jobs/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { searchJobs, calculateJobMatch, type JobPosting } from '@/lib/jobs-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MapPin, DollarSign, Calendar, ExternalLink, Target, Search, Briefcase, ArrowLeft, TrendingUp, Award, CheckCircle2, Filter, Bookmark, Clock, Sparkles, X, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>([])
  const [userSkills, setUserSkills] = useState<string[]>([])
  const [targetRole, setTargetRole] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [selectedMatchFilter, setSelectedMatchFilter] = useState<'all' | 'excellent' | 'good' | 'potential'>('all')
  const [expandedJob, setExpandedJob] = useState<string | null>(null)
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set())
  const router = useRouter()

  useEffect(() => {
    loadUserDataAndJobs()
  }, [])

  useEffect(() => {
    filterJobs()
  }, [jobs, selectedMatchFilter])

  const loadUserDataAndJobs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

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
      
      const jobsWithScores = jobResults.map(job => ({
        ...job,
        matchScore: calculateJobMatch(job, userSkills)
      }))

      jobsWithScores.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      
      setJobs(jobsWithScores)
    } catch (error) {
      console.error('Error searching jobs:', error)
    }
    setSearching(false)
  }

  const filterJobs = () => {
    let filtered = [...jobs]
    
    if (selectedMatchFilter === 'excellent') {
      filtered = filtered.filter(j => (j.matchScore || 0) >= 70)
    } else if (selectedMatchFilter === 'good') {
      filtered = filtered.filter(j => (j.matchScore || 0) >= 50 && (j.matchScore || 0) < 70)
    } else if (selectedMatchFilter === 'potential') {
      filtered = filtered.filter(j => (j.matchScore || 0) < 50)
    }
    
    setFilteredJobs(filtered)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      performJobSearch(searchTerm.trim(), location.trim())
    }
  }

  const toggleSaveJob = (jobId: string) => {
    const newSaved = new Set(savedJobs)
    if (newSaved.has(jobId)) {
      newSaved.delete(jobId)
    } else {
      newSaved.add(jobId)
    }
    setSavedJobs(newSaved)
  }

  const getMatchCategory = (score: number) => {
    if (score >= 70) return { label: 'Excellent Match', color: 'green', icon: '🎯' }
    if (score >= 50) return { label: 'Good Match', color: 'yellow', icon: '⭐' }
    return { label: 'Potential', color: 'gray', icon: '💡' }
  }

  const getMissingSkills = (job: JobPosting) => {
    if (!job.requirements) return []
    return job.requirements.filter(req => 
      !userSkills.some(skill => skill.toLowerCase() === req.toLowerCase())
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex justify-center items-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-600 text-lg">Finding perfect jobs for you...</div>
        </div>
      </div>
    )
  }

  const excellentMatches = jobs.filter(j => (j.matchScore || 0) >= 70).length
  const goodMatches = jobs.filter(j => (j.matchScore || 0) >= 50 && (j.matchScore || 0) < 70).length
  const potentialMatches = jobs.filter(j => (j.matchScore || 0) < 50).length

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      {/* Top Navigation Bar */}
      <div className="bg-white text-gray-900 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/dashboard')}
                className="text-gray-300 hover:text-white flex items-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-black" />
                <span className="font-medium text-black">Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-600"></div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">Job Search</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold">{filteredJobs.length}</div>
                <div className="text-xs text-gray-400">Available Jobs</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Hero Section with Search - GREY GRADIENT */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6 text-black relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gray-700 rounded-full opacity-10 blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="max-w-3xl mx-auto text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium text-black">AI-Powered Job Matching</span>
              </div>
              <h2 className="text-4xl font-bold mb-3">Find Your Dream Job</h2>
              <p className="text-black text-lg">
                We match you with opportunities that fit your <span className="font-semibold text-gray-600">{userSkills.length} skills</span>
              </p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-2xl p-2 flex flex-col md:flex-row gap-2">
                <div className="flex-1 flex items-center gap-2 px-4">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Job title or keyword..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div className="hidden md:block w-px bg-gray-200"></div>
                <div className="flex-1 flex items-center gap-2 px-4">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Location..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {searching ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Search
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filter by match:</span>
          </div>
          <button
            onClick={() => setSelectedMatchFilter('all')}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              selectedMatchFilter === 'all'
                ? 'bg-gray-900 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            All Jobs ({jobs.length})
          </button>
          <button
            onClick={() => setSelectedMatchFilter('excellent')}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              selectedMatchFilter === 'excellent'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            🎯 Excellent ({excellentMatches})
          </button>
          <button
            onClick={() => setSelectedMatchFilter('good')}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              selectedMatchFilter === 'good'
                ? 'bg-yellow-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            ⭐ Good ({goodMatches})
          </button>
          <button
            onClick={() => setSelectedMatchFilter('potential')}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              selectedMatchFilter === 'potential'
                ? 'bg-gray-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            💡 Potential ({potentialMatches})
          </button>
        </div>

        {/* Job Listings */}
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Jobs Found</h3>
              <p className="text-gray-600 mb-8">
                Try adjusting your filters or search for different keywords.
              </p>
              <button
                onClick={() => {
                  setSelectedMatchFilter('all')
                  performJobSearch(targetRole)
                }}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all shadow-lg"
              >
                Reset & Search for {targetRole}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredJobs.map((job) => {
              const matchCategory = getMatchCategory(job.matchScore || 0)
              const missingSkills = getMissingSkills(job)
              const isExpanded = expandedJob === job.id
              const isSaved = savedJobs.has(job.id)

              return (
                <div 
                  key={job.id} 
                  className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-blue-300 transition-all overflow-hidden group"
                >
                  {/* Card Header */}
                  <div className="p-6 pb-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">
                            {job.company.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                              {job.title}
                            </h3>
                            <p className="text-sm font-semibold text-gray-700 mb-1">{job.company}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-600">
                              {job.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {job.location}
                                </span>
                              )}
                              {job.salary && (
                                <span className="flex items-center gap-1 font-medium text-green-700">
                                  <DollarSign className="w-3 h-3" />
                                  {job.salary}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Match Score Circle */}
                      <div className="flex flex-col items-center gap-2 ml-3">
                        <div className={`relative w-16 h-16 rounded-full flex items-center justify-center ${
                          matchCategory.color === 'green' ? 'bg-green-100' :
                          matchCategory.color === 'yellow' ? 'bg-yellow-100' :
                          'bg-gray-100'
                        }`}>
                          <svg className="absolute inset-0 w-16 h-16 -rotate-90">
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="4"
                              className={
                                matchCategory.color === 'green' ? 'text-green-200' :
                                matchCategory.color === 'yellow' ? 'text-yellow-200' :
                                'text-gray-200'
                              }
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="4"
                              strokeDasharray={`${(job.matchScore || 0) * 1.76} 176`}
                              className={
                                matchCategory.color === 'green' ? 'text-green-600' :
                                matchCategory.color === 'yellow' ? 'text-yellow-600' :
                                'text-gray-600'
                              }
                            />
                          </svg>
                          <span className="text-lg font-bold text-gray-900">{job.matchScore || 0}%</span>
                        </div>
                        <button
                          onClick={() => toggleSaveJob(job.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            isSaved 
                              ? 'bg-blue-100 text-blue-600' 
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                          }`}
                        >
                          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Match Category Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
                        matchCategory.color === 'green' ? 'bg-green-100 text-green-800' :
                        matchCategory.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        <span>{matchCategory.icon}</span>
                        {matchCategory.label}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {new Date(job.postedDate).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Description */}
                    <p className={`text-sm text-gray-700 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                      {job.description}
                    </p>

                    {/* Expandable Content */}
                    {isExpanded && (
                      <div className="mt-4 space-y-4 animate-in slide-in-from-top-2">
                        {/* Skills Match */}
                        {job.requirements && job.requirements.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              Skills Required
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {job.requirements.map((req, i) => {
                                const hasSkill = userSkills.some(skill => 
                                  skill.toLowerCase() === req.toLowerCase()
                                )
                                return (
                                  <span
                                    key={i}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                                      hasSkill 
                                        ? 'bg-green-100 text-green-800 border border-green-200' 
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                    }`}
                                  >
                                    {req} {hasSkill ? '✓' : '✗'}
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Missing Skills Alert */}
                        {missingSkills.length > 0 && (
                          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                            <p className="text-xs font-medium text-orange-900 mb-1">
                              💡 Skills to Learn: <span className="font-bold">{missingSkills.length} missing</span>
                            </p>
                            <p className="text-xs text-orange-700">
                              Consider learning: {missingSkills.slice(0, 3).join(', ')}
                              {missingSkills.length > 3 && ` +${missingSkills.length - 3} more`}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <button
                      onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                      className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors"
                    >
                      {isExpanded ? 'Show Less' : 'View Details'}
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    <a 
                      href={job.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-black hover:bg-gray-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center gap-2 text-sm"
                    >
                      Apply Now
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}