// /Users/aryangupta/Developer/iexcel-career-tool/src/app/plan/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Target, ExternalLink, Play, BookOpen, Clock, Star, Calendar, Flame, ArrowLeft, ChevronRight } from 'lucide-react'

// Learning Resources Component (Compact)
interface LearningResourcesProps {
  skillName: string
  taskId: string
}

function LearningResources({ skillName, taskId }: LearningResourcesProps) {
  const [resources, setResources] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showResources, setShowResources] = useState(false)

  const loadResources = async () => {
    if (resources) {
      setShowResources(!showResources)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillName: skillName,
          includeYouTube: true,
          includeCourses: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        setResources(data.resources)
        setShowResources(true)
      }
    } catch (error) {
      console.error('Error loading resources:', error)
    }
    setLoading(false)
  }

  return (
    <div className="mt-2">
      <button
        onClick={loadResources}
        disabled={loading}
        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
      >
        {loading ? 'Loading...' : showResources ? '▼ Hide Resources' : '▶ Show Resources'}
      </button>

      {showResources && resources && (
        <div className="mt-2 space-y-2 pl-4 border-l-2 border-blue-200">
          {resources.youtube?.slice(0, 2).map((video: any) => (
            <a
              key={video.id}
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-gray-700 hover:text-blue-600 hover:underline"
            >
              🎥 {video.title}
            </a>
          ))}
          {resources.courses?.slice(0, 2).map((course: any) => (
            <a
              key={course.id}
              href={course.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-gray-700 hover:text-blue-600 hover:underline"
            >
              📚 {course.title}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

// Study Timer Component (Inline)
interface StudyTimerProps {
  userId: string
  planId: string
  taskId: string
  skillName: string
}

function StudyTimer({ userId, planId, taskId, skillName }: StudyTimerProps) {
  const [isActive, setIsActive] = useState(false)
  const [time, setTime] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isActive) {
      interval = setInterval(() => setTime(t => t + 1), 1000)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [isActive])

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="text-xs font-mono text-blue-600 font-bold">{formatTime(time)}</span>
      {!isActive ? (
        <button 
          onClick={() => setIsActive(true)}
          className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
        >
          ▶ Start
        </button>
      ) : (
        <>
          <button 
            onClick={() => setIsActive(false)}
            className="text-xs px-2 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            ⏸ Pause
          </button>
          <button 
            onClick={() => { setIsActive(false); setTime(0); }}
            className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            ✓ Done
          </button>
        </>
      )}
    </div>
  )
}

export default function PlanPage() {
  const [plan, setPlan] = useState<any>(null)
  const [progress, setProgress] = useState<any>(null)
  const [completedTasks, setCompletedTasks] = useState<string[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState(1)
  const router = useRouter()

  useEffect(() => {
    loadPlanAndProgress()
  }, [])

  const loadPlanAndProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/signin')
        return
      }
      setUser(user)

      const { data: plans } = await supabase
        .from('learning_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (plans && plans.length > 0) {
        setPlan(plans[0])
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('plan_id', plans[0].id)
          .single()

        if (progressData) {
          setProgress(progressData)
          setCompletedTasks(progressData.completed_tasks || [])
        }

        // Set current week as default
        setSelectedWeek(getCurrentWeek(plans[0]))
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading plan:', error)
      setLoading(false)
    }
  }

  const toggleTaskComplete = async (taskId: string) => {
    if (!progress || updating) return
    setUpdating(true)

    const isCurrentlyComplete = completedTasks.includes(taskId)
    const newCompletedTasks = isCurrentlyComplete
      ? completedTasks.filter(id => id !== taskId)
      : [...completedTasks, taskId]

    const totalTasks = getTotalTasks(plan.plan_data)
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
        setCompletedTasks(newCompletedTasks)
        setProgress((prev: any) => ({
          ...prev,
          completed_tasks: newCompletedTasks,
          overall_completion_percentage: newProgress
        }))
      }
    } catch (error) {
      console.error('Error updating progress:', error)
    }
    setUpdating(false)
  }

  const getTotalTasks = (planData: any): number => {
    return planData?.weeks?.reduce((total: number, week: any) =>
      total + (week.tasks?.length || 0), 0) || 0
  }

  const getCurrentWeek = (planObj: any): number => {
    if (!planObj) return 1
    const startDate = new Date(planObj.created_at)
    const now = new Date()
    const weeksPassed = Math.floor((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
    return Math.min(weeksPassed + 1, planObj.duration_weeks || 1)
  }

  const getWeekProgress = (weekTasks: any[]): number => {
    if (!weekTasks || weekTasks.length === 0) return 0
    const completed = weekTasks.filter(task => completedTasks.includes(task.id)).length
    return Math.round((completed / weekTasks.length) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex justify-center items-center">
        <div className="text-gray-600">Loading your learning plan...</div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex justify-center items-center">
        <div className="text-center bg-white rounded-2xl shadow-xl border border-gray-100 p-12 max-w-md">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">No Learning Plan Found</h2>
          <p className="text-gray-600 mb-6">Create your learning plan to get started.</p>
          <button 
            onClick={() => router.push('/onboarding')}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg"
          >
            Create Learning Plan
          </button>
        </div>
      </div>
    )
  }

  const planData = plan.plan_data
  const totalTasks = getTotalTasks(planData)
  const overallProgress = progress?.overall_completion_percentage || 0
  const currentWeek = getCurrentWeek(plan)
  const selectedWeekData = planData?.weeks?.[selectedWeek - 1]
  const weekProgress = selectedWeekData ? getWeekProgress(selectedWeekData.tasks || []) : 0

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex flex-col">
      {/* Top Bar */}
      <div className="bg-white text-black px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="text-black flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4 text-black" />
              Dashboard
            </button>
            <div className="h-6 w-px bg-gray-600"></div>
            <div>
              <h1 className="text-xl font-bold">{plan.title || 'Learning Plan'}</h1>
              <p className="text-xs text-gray-700">Week {currentWeek} of {plan.duration_weeks}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-2xl font-bold">{overallProgress}%</div>
              <div className="text-xs text-black">Overall Progress</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{completedTasks.length}/{totalTasks}</div>
              <div className="text-xs text-black">Tasks Complete</div>
            </div>
            <button
              onClick={() => router.push('/jobs')}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-700 font-medium text-sm"
            >
              Browse Jobs
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Week List */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-600 mb-3 flex items-center">
              <BookOpen className="w-4 h-4 mr-2" />
              WEEKS
            </h2>
            <div className="space-y-1">
              {planData?.weeks?.map((week: any, index: number) => {
                const weekNumber = week.week || index + 1
                const isSelected = weekNumber === selectedWeek
                const isCurrent = weekNumber === currentWeek
                const progress = getWeekProgress(week.tasks || [])
                
                return (
                  <button
                    key={weekNumber}
                    onClick={() => setSelectedWeek(weekNumber)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                      isSelected 
                        ? 'bg-blue-50 border-2 border-blue-500' 
                        : 'border-2 border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-semibold text-sm ${
                        isSelected ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        Week {weekNumber}
                      </span>
                      {isCurrent && (
                        <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600">{progress}%</span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-1">{week.milestone}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Content - Selected Week Details */}
        <div className="flex-1 overflow-y-auto bg-[#f5f5f0]">
          <div className="max-w-4xl mx-auto p-6">
            {selectedWeekData ? (
              <>
                {/* Week Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${
                          selectedWeek === currentWeek
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {selectedWeek}
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Week {selectedWeek}</h2>
                          <p className="text-gray-600">{selectedWeekData.milestone}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900">{weekProgress}%</div>
                      <div className="text-sm text-gray-500">{selectedWeekData.totalHours || 0}h planned</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-2.5 rounded-full transition-all"
                        style={{ width: `${weekProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Focus Areas */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center text-sm">
                      <Target className="w-4 h-4 mr-1.5 text-blue-600" />
                      Focus Areas
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedWeekData.focus?.map((skill: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium border border-blue-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tasks */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <CheckCircle2 className="w-5 h-5 mr-2 text-purple-600" />
                    Tasks ({selectedWeekData.tasks?.length || 0})
                  </h3>

                  {selectedWeekData.tasks?.map((task: any, i: number) => {
                    const isCompleted = completedTasks.includes(task.id)
                    const primarySkill = selectedWeekData.focus?.[0] || 'General'

                    return (
                      <div
                        key={i}
                        className={`bg-white rounded-xl border-2 p-4 transition-all ${
                          isCompleted
                            ? 'border-green-200 bg-green-50'
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isCompleted}
                            onChange={() => toggleTaskComplete(task.id)}
                            disabled={updating}
                            className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />

                          <div className="flex-1">
                            <h5 className={`font-semibold text-lg mb-1 ${
                              isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
                            }`}>
                              {task.title}
                            </h5>
                            <p className={`text-sm mb-2 ${
                              isCompleted ? 'text-gray-400' : 'text-gray-700'
                            }`}>
                              {task.description}
                            </p>

                            <div className="flex items-center gap-2 mb-2">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                <Clock className="w-3 h-3" />
                                {task.estimatedHours}h
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                {task.type}
                              </span>
                            </div>

                            {!isCompleted && user && (
                              <>
                                <StudyTimer
                                  userId={user.id}
                                  planId={plan.id}
                                  taskId={task.id}
                                  skillName={primarySkill}
                                />
                                <LearningResources
                                  skillName={primarySkill}
                                  taskId={task.id}
                                />
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Select a week to view tasks</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}