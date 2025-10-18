// /Users/aryangupta/Developer/iexcel-career-tool/src/app/dashboard/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import AnalyticsDashboard from '@/components/analytics-dashboard'
import { CheckCircle2, Clock, Target, TrendingUp, Calendar, Briefcase, MapPin, DollarSign, ExternalLink, BarChart3, Award, Zap, BookOpen, Flame, ArrowRight } from 'lucide-react'

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

                if (profile.target_role) {
                    await loadJobRecommendations(profile.target_role, skillsData)
                }
            }

            const { data: plans } = await supabase
                .from('learning_plans')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)

            const plan = plans && plans.length > 0 ? plans[0] : null
            setLearningPlan(plan)

            if (plan) {
                const { data: progressData } = await supabase
                    .from('user_progress')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('plan_id', plan.id)
                    .single()

                setProgress(progressData)

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

                if (data.jobs && data.jobs.length > 0) {
                    const jobsWithScores = data.jobs.map((job: any) => ({
                        ...job,
                        matchScore: calculateJobMatch(job, skills)
                    }))

                    jobsWithScores.sort((a: any, b: any) => (b.matchScore || 0) - (a.matchScore || 0))
                    setRecommendedJobs(jobsWithScores.slice(0, 4))
                }
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
                loadDashboardData()
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
            <div className="min-h-screen bg-[#f5f5f0] flex justify-center items-center">
                <div className="text-gray-600 text-lg">Loading your dashboard...</div>
            </div>
        )
    }

    const overallProgress = progress?.overall_completion_percentage || 0
    const completedTasks = progress?.completed_tasks?.length || 0
    const currentWeek = learningPlan ? getCurrentWeek(learningPlan) : 1
    const studyHoursThisWeek = 0

    return (
        <div className="min-h-screen bg-[#f5f5f0]">
            <div className="max-w-7xl mx-auto p-6 sm:p-8">
                {/* Hero Header - Combines greeting and key stats */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 text-black relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 blur-3xl"></div>
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-4xl font-bold mb-2">
                                    Welcome back, {profile?.full_name?.split(' ')[0]}! 👋
                                </h1>
                                <p className="text-gray-700 text-lg">
                                    You're on track to becoming a <span className="text-gray-500 font-semibold">{profile?.target_role}</span>
                                </p>
                            </div>
                            <button 
                                onClick={() => router.push('/plan')}
                                className="px-6 py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                View Full Plan
                            </button>
                        </div>

                        {/* Inline Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold">{overallProgress}%</div>
                                    <div className="text-gray-700 text-sm">Overall Progress</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold">{studyHoursThisWeek}h</div>
                                    <div className="text-gray-700 text-sm">This Week</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold">{completedTasks}</div>
                                    <div className="text-gray-700 text-sm">Tasks Done</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                                    <Award className="w-6 h-6 text-orange-400" />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold">{skillsCount}</div>
                                    <div className="text-gray-700 text-sm">Skills Mastered</div>
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-6">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-700">Learning Journey</span>
                                <span className="text-gray-700">Week {currentWeek} of {learningPlan?.duration_weeks || 12}</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-3">
                                <div
                                    className="bg-gradient-to-r from-blue-400 to-purple-400 h-3 rounded-full transition-all duration-700"
                                    style={{ width: `${overallProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    
                    {/* Next Actions - Takes 2 columns */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                Your Next Actions
                            </h2>
                            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
                                Week {currentWeek}
                            </span>
                        </div>

                        {nextActions.length > 0 ? (
                            <div className="space-y-3">
                                {nextActions.map((action, index) => (
                                    <div 
                                        key={action.id}
                                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors group"
                                    >
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {action.estimatedHours}h
                                                </span>
                                                <span>•</span>
                                                <span>{action.type}</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => markTaskComplete(action.id)}
                                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            Complete
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                                <p className="text-gray-600 font-medium">Great job! You're all caught up.</p>
                            </div>
                        )}

                        <button 
                            onClick={() => router.push('/plan')}
                            className="w-full mt-4 py-3 text-gray-700 hover:text-gray-900 font-medium text-sm flex items-center justify-center gap-2 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            View All Tasks
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Study Streak - Compact card */}
                    <div className="bg-white rounded-2xl shadow-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Study Streak</h3>
                            <Flame className="w-6 h-6 text-orange-500" />
                        </div>
                        
                        <div className="text-center my-6">
                            <div className="text-6xl font-bold text-orange-600 mb-2">0</div>
                            <div className="text-gray-600 text-sm">days • longest: 0</div>
                        </div>

                        <div className="bg-white rounded-xl p-4 border border-orange-200">
                            <div className="text-sm text-gray-700 mb-2">This Week's Goal</div>
                            <div className="flex items-center justify-between">
                                <div className="text-2xl font-bold text-gray-900">{studyHoursThisWeek}h</div>
                                <div className="text-sm text-gray-500">of {profile?.study_hours_per_week}h</div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div
                                    className="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full"
                                    style={{ width: `${profile?.study_hours_per_week ? (studyHoursThisWeek / profile.study_hours_per_week) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Job Recommendations */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-green-600" />
                            Jobs Matching Your Skills
                        </h2>
                        <button 
                            onClick={() => router.push('/jobs')}
                            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium text-sm flex items-center gap-2"
                        >
                            View All
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {jobsLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-gray-600">Finding jobs for you...</p>
                        </div>
                    ) : recommendedJobs.length > 0 ? (
                        <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 lg:grid lg:grid-cols-2 lg:overflow-visible">
                            {recommendedJobs.map((job) => (
                                <div key={job.id} className="min-w-[320px] lg:min-w-0 border-2 border-gray-100 rounded-xl p-5 hover:border-blue-200 hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-bold text-gray-900 mb-1">{job.title}</h3>
                                            <div className="text-sm text-gray-600 flex items-center gap-2">
                                                <span className="font-medium">{job.company}</span>
                                                {job.location && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {job.location}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${
                                            (job.matchScore || 0) >= 70 ? 'bg-green-100 text-green-800' :
                                            (job.matchScore || 0) >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {job.matchScore || 0}% match
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-1 mb-4">
                                        {job.requirements?.slice(0, 5).map((req: string, i: number) => {
                                            const hasSkill = userSkills.some(skill =>
                                                skill.skills.name.toLowerCase() === req.toLowerCase()
                                            )
                                            return (
                                                <span 
                                                    key={i}
                                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                                        hasSkill ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                                                    }`}
                                                >
                                                    {req} {hasSkill && '✓'}
                                                </span>
                                            )
                                        })}
                                    </div>

                                    <button 
                                        onClick={() => job.url !== '#' && window.open(job.url, '_blank')}
                                        className="w-full py-2 bg-black hover:bg-gray-700 text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2"
                                    >
                                        View Details
                                        <ExternalLink className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Finding Jobs for You</h3>
                            <p className="text-gray-600 mb-6">
                                We're searching for {profile?.target_role} opportunities
                            </p>
                            <button
                                onClick={() => router.push('/jobs')}
                                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg"
                            >
                                Browse All Jobs
                            </button>
                        </div>
                    )}
                </div>

                {/* Learning Plan Summary */}
                {learningPlan && (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">{learningPlan.title}</h2>
                                <p className="text-gray-600">
                                    {learningPlan.plan_data?.overview || 'Your personalized learning journey'}
                                </p>
                            </div>
                            <button
                                onClick={() => router.push('/plan')}
                                className="px-5 py-2.5 bg-black hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                            >
                                View Full Plan
                            </button>
                        </div>

                        <div className="grid md:grid-cols-4 gap-4">
                            <div className="text-center bg-black rounded-xl p-4 border border-blue-100">
                                <div className="text-3xl font-bold text-white mb-1">{learningPlan.duration_weeks}</div>
                                <div className="text-sm text-white font-medium">Weeks</div>
                            </div>
                            <div className="text-center bg-black rounded-xl p-4 border border-green-100">
                                <div className="text-3xl font-bold text-white mb-1">{learningPlan.total_hours}</div>
                                <div className="text-sm text-white font-medium">Total Hours</div>
                            </div>
                            <div className="text-center bg-black rounded-xl p-4 border border-purple-100">
                                <div className="text-3xl font-bold text-white mb-1">{completedTasks}</div>
                                <div className="text-sm text-white font-medium">Tasks Done</div>
                            </div>
                            <div className="text-center bg-black rounded-xl p-4 border border-orange-100">
                                <div className="text-3xl font-bold text-white mb-1">{currentWeek}</div>
                                <div className="text-sm text-white font-medium">Current Week</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Analytics */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                        Your Learning Analytics
                    </h2>
                    <AnalyticsDashboard userId={user?.id} planId={learningPlan?.id} />
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                        onClick={() => router.push('/plan')}
                        disabled={!learningPlan}
                        className="flex-1 py-4 bg-black text-white disabled:bg-gray-100 disabled:cursor-not-allowed border-2 border-gray-200 hover:border-gray-300 rounded-xl font-medium text-gray-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                    >
                        <BookOpen className="w-5 h-5" />
                        View Learning Plan
                    </button>
                    <button 
                        onClick={() => router.push('/jobs')}
                        className="flex-1 py-4 bg-black text-white  border-2 border-gray-200 hover:border-gray-300 rounded-xl font-medium text-gray-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                    >
                        <Briefcase className="w-5 h-5" />
                        Browse More Jobs
                    </button>
                    <button 
                        disabled={!learningPlan}
                        className="flex-1 py-4 bg-black text-white  disabled:bg-gray-100 disabled:cursor-not-allowed border-2 border-gray-200 hover:border-gray-300 rounded-xl font-medium text-gray-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                    >
                        <Target className="w-5 h-5" />
                        Track Progress
                    </button>
                </div>
            </div>
        </div>
    )
}