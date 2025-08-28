// /Users/aryangupta/Developer/iexcel-career-tool/src/app/dashboard/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Clock, Target, TrendingUp, Calendar, Briefcase, MapPin, DollarSign, ExternalLink } from 'lucide-react'

export default function Dashboard() {
    const [user, setUser] = useState<any>(null) 
    const [profile, setProfile] = useState<any>(null)
    const [learningPlan, setLearningPlan] = useState<any>(null)
    const [progress, setProgress] = useState<any>(null)
    const [skillsCount, setSkillsCount] = useState(0)
    const [userSkills, setUserSkills] = useState<any[]>([])
    const [recommendedJobs, setRecommendedJobs] = useState<any[]>([])
    const [jobsLoading, setJobsLoading] = useState(false)
    const [nextActions, setNextActions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/auth/signin')
                return
            }

            setUser(user)

            // Load user profile
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (!profile) {
                router.push('/onboarding')
                return
            }

            setProfile(profile)

            // Load user skills with job recommendations
            const { data: skillsData } = await supabase
                .from('user_skills')
                .select(`
                    *,
                    skills (name, category)
                `)
                .eq('user_id', user.id)

            if (skillsData) {
                setUserSkills(skillsData)
                setSkillsCount(skillsData.length)
                
                // Load job recommendations based on target role and skills
                if (profile.target_role) {
                    await loadJobRecommendations(profile.target_role, skillsData)
                }
            }

            // Load most recent learning plan
            const { data: plans } = await supabase
                .from('learning_plans')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)

            const plan = plans && plans.length > 0 ? plans[0] : null
            setLearningPlan(plan)

            // Load progress
            if (plan) {
                const { data: progressData } = await supabase
                    .from('user_progress')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('plan_id', plan.id)
                    .single()

                setProgress(progressData)

                // Calculate next actions
                if (progressData && plan.plan_data) {
                    const actions = getNextActions(plan, progressData)
                    setNextActions(actions)
                }
            }

            setLoading(false)
        } catch (error) {
            console.error('Error loading dashboard:', error)
            setLoading(false)
        }
    }

    const loadJobRecommendations = async (targetRole: string, skills: any[]) => {
        if (!targetRole || skills.length === 0) return

        setJobsLoading(true)
        try {
            console.log('Loading job recommendations for:', targetRole, 'with', skills.length, 'skills')
            
            const response = await fetch('/api/job/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    keywords: targetRole,
                    location: 'India',
                    limit: 4
                })
            })

            if (response.ok) {
                const data = await response.json()
                console.log('Job API response:', data)
                
                if (data.jobs && data.jobs.length > 0) {
                    // Calculate match scores
                    const jobsWithScores = data.jobs.map((job: any) => ({
                        ...job,
                        matchScore: calculateJobMatch(job, skills)
                    }))

                    // Sort by match score
                    jobsWithScores.sort((a: any, b: any) => (b.matchScore || 0) - (a.matchScore || 0))
                    setRecommendedJobs(jobsWithScores.slice(0, 4))
                    console.log('Set recommended jobs:', jobsWithScores.length)
                }
            } else {
                console.error('Job API failed:', response.status)
            }
        } catch (error) {
            console.error('Error loading job recommendations:', error)
        }
        setJobsLoading(false)
    }

    const calculateJobMatch = (job: any, userSkills: any[]): number => {
        if (!job.requirements || job.requirements.length === 0) return 30
        if (!userSkills || userSkills.length === 0) return 10

        const userSkillNames = userSkills
            .filter(skill => skill.proficiency_level >= 2)
            .map(skill => skill.skills.name.toLowerCase())

        const matchedRequirements = job.requirements.filter((req: string) =>
            userSkillNames.some(userSkill => 
                userSkill.includes(req.toLowerCase()) || req.toLowerCase().includes(userSkill)
            )
        )

        return Math.round((matchedRequirements.length / job.requirements.length) * 100)
    }

    const getNextActions = (plan: any, progress: any) => {
        const currentWeek = getCurrentWeek(plan)
        const completedTasks = progress.completed_tasks || []

        if (!plan.plan_data?.weeks || currentWeek > plan.plan_data.weeks.length) {
            return []
        }

        const weekData = plan.plan_data.weeks[currentWeek - 1]
        if (!weekData?.tasks) return []

        const pendingTasks = weekData.tasks
            .filter((task: any) => !completedTasks.includes(task.id))
            .slice(0, 3)
            .map((task: any) => ({
                ...task,
                week: currentWeek
            }))

        return pendingTasks
    }

    const getCurrentWeek = (plan: any): number => {
        const startDate = new Date(plan.created_at)
        const now = new Date()
        const weeksPassed = Math.floor((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
        return Math.min(weeksPassed + 1, plan.duration_weeks || 1)
    }

    const markTaskComplete = async (taskId: string) => {
        if (!progress) return

        const newCompletedTasks = [...(progress.completed_tasks || []), taskId]
        const totalTasks = getTotalTasks(learningPlan.plan_data)
        const newProgress = Math.round((newCompletedTasks.length / totalTasks) * 100)

        try {
            const { error } = await supabase
                .from('user_progress')
                .update({
                    completed_tasks: newCompletedTasks,
                    overall_completion_percentage: newProgress,
                    last_activity_date: new Date().toISOString().split('T')[0],
                    updated_at: new Date().toISOString()
                })
                .eq('id', progress.id)

            if (!error) {
                loadDashboardData() // Reload to update UI
            }
        } catch (error) {
            console.error('Error updating task:', error)
        }
    }

    const getTotalTasks = (planData: any): number => {
        return planData?.weeks?.reduce((total: number, week: any) =>
            total + (week.tasks?.length || 0), 0) || 0
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex justify-center items-center">
                <div className="text-gray-600">Loading your dashboard...</div>
            </div>
        )
    }

    const overallProgress = progress?.overall_completion_percentage || 0
    const completedTasks = progress?.completed_tasks?.length || 0
    const currentWeek = learningPlan ? getCurrentWeek(learningPlan) : 1

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Welcome back, {profile?.full_name?.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-gray-600">
                        You're on your way to becoming a {profile?.target_role}
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
                    {/* Progress Card */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Progress</h3>
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold text-blue-600 mb-2">{overallProgress}%</div>
                        {/* Simple Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${overallProgress}%` }}
                            />
                        </div>
                        <p className="text-sm text-gray-600">
                            {learningPlan ? `Week ${currentWeek} of ${learningPlan.duration_weeks}` : 'Overall completion'}
                        </p>
                    </div>

                    {/* This Week Card */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">This Week</h3>
                            <Calendar className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-600 mb-2">0h</div>
                        <p className="text-sm text-gray-600">of {profile?.study_hours_per_week}h goal</p>
                    </div>

                    {/* Tasks Card */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Tasks Done</h3>
                            <CheckCircle2 className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="text-3xl font-bold text-purple-600 mb-2">{completedTasks}</div>
                        <p className="text-sm text-gray-600">tasks completed</p>
                    </div>

                    {/* Skills Card */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Skills</h3>
                            <Target className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="text-3xl font-bold text-orange-600 mb-2">{skillsCount}</div>
                        <p className="text-sm text-gray-600">skills added</p>
                    </div>
                </div>

                {/* Next Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                        <Clock className="w-5 h-5 mr-2" />
                        Your Next 3 Actions
                    </h2>

                    {nextActions.length > 0 ? (
                        <div className="space-y-4">
                            {nextActions.map((action, index) => (
                                <div key={action.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-gray-900">{action.title}</h3>
                                        <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                                        <div className="flex items-center space-x-2 mt-2">
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                Week {action.week}
                                            </span>
                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                {action.estimatedHours}h
                                            </span>
                                            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                                {action.type}
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => markTaskComplete(action.id)}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        Mark Complete
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                            <p>Great job! You're all caught up.</p>
                            <p className="text-sm">Check your learning plan for more tasks.</p>
                        </div>
                    )}
                </div>

                {/* Job Recommendations Section - COMPLETELY FUNCTIONAL */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                            <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
                            Recommended Jobs in India
                        </h2>
                        <Button 
                            variant="outline" 
                            onClick={() => router.push('/jobs')}
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                            View All Jobs
                        </Button>
                    </div>

                    {jobsLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-gray-600">Finding jobs for you...</p>
                        </div>
                    ) : recommendedJobs.length > 0 ? (
                        <div className="grid gap-4">
                            {recommendedJobs.map((job) => (
                                <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 mb-1">{job.title}</h3>
                                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                                <span className="font-medium text-gray-800">{job.company}</span>
                                                {job.location && (
                                                    <span className="flex items-center">
                                                        <MapPin className="w-3 h-3 mr-1" />
                                                        {job.location}
                                                    </span>
                                                )}
                                                {job.salary && (
                                                    <span className="flex items-center">
                                                        <DollarSign className="w-3 h-3 mr-1" />
                                                        {job.salary}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="text-right ml-4">
                                            <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${
                                                (job.matchScore || 0) >= 70 ? 'bg-green-100 text-green-800' :
                                                (job.matchScore || 0) >= 40 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {job.matchScore || 0}% match
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                                        {job.description}
                                    </p>

                                    {job.requirements && job.requirements.length > 0 && (
                                        <div className="mb-3">
                                            <div className="flex flex-wrap gap-1">
                                                {job.requirements.slice(0, 5).map((req: string, i: number) => {
                                                    const hasSkill = userSkills.some(skill => 
                                                        skill.skills.name.toLowerCase() === req.toLowerCase()
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
                                                {job.requirements.length > 5 && (
                                                    <span className="text-xs text-gray-500 px-2 py-1">
                                                        +{job.requirements.length - 5} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500">
                                            via {job.source}
                                        </span>
                                        <Button 
                                            size="sm" 
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                            onClick={() => job.url !== '#' && window.open(job.url, '_blank')}
                                        >
                                            View Job <ExternalLink className="w-3 h-3 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Finding Jobs for You</h3>
                            <p className="text-gray-600 mb-6">
                                We're searching for {profile?.target_role} opportunities in India that match your skills
                            </p>
                            <Button
                                onClick={() => router.push('/jobs')}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Browse All Available Jobs
                            </Button>
                        </div>
                    )}
                </div>

                {/* Learning Plan Summary */}
                {learningPlan ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">{learningPlan.title}</h2>
                                <p className="text-gray-600 mt-1">
                                    {learningPlan.plan_data?.overview || 'Your personalized learning journey'}
                                </p>
                            </div>
                            <Button onClick={() => router.push('/plan')}>
                                View Full Plan
                            </Button>
                        </div>

                        <div className="grid md:grid-cols-4 gap-4">
                            <div className="text-center bg-blue-50 rounded-lg p-3">
                                <div className="text-2xl font-bold text-blue-600">{learningPlan.duration_weeks}</div>
                                <div className="text-sm text-gray-600">Weeks</div>
                            </div>
                            <div className="text-center bg-green-50 rounded-lg p-3">
                                <div className="text-2xl font-bold text-green-600">{learningPlan.total_hours}</div>
                                <div className="text-sm text-gray-600">Total Hours</div>
                            </div>
                            <div className="text-center bg-purple-50 rounded-lg p-3">
                                <div className="text-2xl font-bold text-purple-600">{completedTasks}</div>
                                <div className="text-sm text-gray-600">Tasks Done</div>
                            </div>
                            <div className="text-center bg-orange-50 rounded-lg p-3">
                                <div className="text-2xl font-bold text-orange-600">{currentWeek}</div>
                                <div className="text-sm text-gray-600">Current Week</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Get Started</h2>
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-2">Complete Skills Assessment</h3>
                                    <p className="text-gray-600">Add your current skills to get personalized recommendations</p>
                                </div>
                                <Button onClick={() => router.push('/onboarding')}>
                                    Start Now
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                        variant="outline"
                        className="h-16"
                        onClick={() => router.push('/plan')}
                        disabled={!learningPlan}
                    >
                        View Learning Plan
                    </Button>
                    <Button
                        variant="outline"
                        className="h-16"
                        onClick={() => router.push('/jobs')}
                    >
                        Browse Jobs
                    </Button>
                    <Button
                        variant="outline"
                        className="h-16"
                        disabled={!learningPlan}
                    >
                        Detailed Progress
                    </Button>
                </div>
            </div>
        </div>
    )
}