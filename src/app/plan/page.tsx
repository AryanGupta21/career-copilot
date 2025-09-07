// /Users/aryangupta/Developer/iexcel-career-tool/src/app/plan/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Target, ExternalLink, Play, BookOpen, Clock, Star, DollarSign, Flame, TrendingUp, BarChart3 } from 'lucide-react'

// Learning Resources Component
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
        headers: {
          'Content-Type': 'application/json',
        },
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
      } else {
        console.error('Failed to load resources')
      }
    } catch (error) {
      console.error('Error loading resources:', error)
    }
    setLoading(false)
  }

  return (
    <div className="mt-3">
      <Button
        variant="outline"
        size="sm"
        onClick={loadResources}
        disabled={loading}
        className="text-blue-600 border-blue-600 hover:bg-blue-50"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 animate-spin border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
            Loading Resources...
          </>
        ) : (
          <>
            <BookOpen className="w-4 h-4 mr-2" />
            {showResources ? 'Hide' : 'Show'} Learning Resources
          </>
        )}
      </Button>

      {showResources && resources && (
        <div className="mt-4 space-y-4">
          {/* YouTube Videos */}
          {resources.youtube && resources.youtube.length > 0 && (
            <div>
              <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                <Play className="w-4 h-4 mr-2 text-red-600" />
                YouTube Tutorials
              </h5>
              <div className="space-y-2">
                {resources.youtube.map((video: any) => (
                  <div key={video.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-16 h-12 rounded object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/120x90/gray/white?text=Video'
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h6 className="text-sm font-medium text-gray-900 line-clamp-1">
                        {video.title}
                      </h6>
                      <p className="text-xs text-gray-600 mt-1">
                        by {video.channel} • {video.duration}
                      </p>
                      <div className="flex items-center mt-2">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Free
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => window.open(video.url, '_blank')}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Watch
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Courses */}
          {resources.courses && resources.courses.length > 0 && (
            <div>
              <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                <BookOpen className="w-4 h-4 mr-2 text-blue-600" />
                Recommended Courses
              </h5>
              <div className="space-y-2">
                {resources.courses.map((course: any) => (
                  <div key={course.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <h6 className="text-sm font-medium text-gray-900 line-clamp-2">
                        {course.title}
                      </h6>
                      {course.rating && (
                        <div className="flex items-center text-xs text-gray-600 ml-2">
                          <Star className="w-3 h-3 text-yellow-500 mr-1" />
                          {course.rating}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs text-gray-600">
                        <span>{course.provider}</span>
                        <span>•</span>
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {course.duration}
                        </div>
                        <span>•</span>
                        <div className={`flex items-center px-2 py-1 rounded-full ${course.free ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                          {course.free ? 'Free' : course.price}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(course.url, '_blank')}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View Course
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Study Timer Component
interface StudyTimerProps {
  userId: string
  planId: string
  taskId: string
  skillName: string
  onSessionComplete?: (duration: number) => void
}

function StudyTimer({ userId, planId, taskId, skillName, onSessionComplete }: StudyTimerProps) {
  const [isActive, setIsActive] = useState(false)
  const [time, setTime] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive) {
      interval = setInterval(() => {
        setTime(time => time + 1)
      }, 1000)
    } else if (!isActive && time !== 0) {
      if (interval) clearInterval(interval)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, time])

  const startTimer = async () => {
    // For now, just start the timer - you can integrate with AnalyticsService later
    setIsActive(true)
    console.log(`Started study session for ${skillName}`)
  }

  const pauseTimer = () => {
    setIsActive(false)
  }

  const stopTimer = async () => {
    setIsActive(false)

    if (time > 0) {
      const minutes = Math.floor(time / 60)
      console.log(`Study session completed: ${minutes} minutes for ${skillName}`)
      onSessionComplete?.(minutes)
      setTime(0)
    }
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border mt-2">
      <div className="flex items-center space-x-2">
        <Clock className="w-4 h-4 text-blue-600" />
        <span className="font-mono text-lg font-semibold text-blue-900">
          {formatTime(time)}
        </span>
      </div>

      <div className="flex space-x-1">
        {!isActive && time === 0 ? (
          <Button size="sm" onClick={startTimer} className="bg-green-600 hover:bg-green-700">
            <Play className="w-3 h-3 mr-1" />
            Start
          </Button>
        ) : !isActive ? (
          <>
            <Button size="sm" onClick={() => setIsActive(true)} className="bg-blue-600 hover:bg-blue-700">
              <Play className="w-3 h-3" />
            </Button>
            <Button size="sm" onClick={stopTimer} variant="outline">
              <CheckCircle2 className="w-3 h-3" />
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" onClick={pauseTimer} className="bg-yellow-600 hover:bg-yellow-700">
              <Clock className="w-3 h-3" />
            </Button>
            <Button size="sm" onClick={stopTimer} variant="outline">
              <CheckCircle2 className="w-3 h-3" />
            </Button>
          </>
        )}
      </div>
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

      // Get the most recent learning plan
      const { data: plans } = await supabase
        .from('learning_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (plans && plans.length > 0) {
        setPlan(plans[0])

        // Load progress for this plan
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

    // Calculate new overall progress
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

  const getCurrentWeek = (): number => {
    if (!plan) return 1
    const startDate = new Date(plan.created_at)
    const now = new Date()
    const weeksPassed = Math.floor((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
    return Math.min(weeksPassed + 1, plan.duration_weeks || 1)
  }

  const getWeekProgress = (weekTasks: any[]): number => {
    if (!weekTasks || weekTasks.length === 0) return 0
    const completed = weekTasks.filter(task => completedTasks.includes(task.id)).length
    return Math.round((completed / weekTasks.length) * 100)
  }

  const handleSessionComplete = (duration: number, taskName: string) => {
    console.log(`Study session completed: ${duration} minutes for ${taskName}`)
    // Here you could show a success message or update additional progress metrics
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-gray-600">Loading your learning plan...</div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Learning Plan Found</h2>
          <p className="text-gray-600 mb-6">Create your learning plan to get started.</p>
          <Button onClick={() => router.push('/onboarding')}>
            Create Learning Plan
          </Button>
        </div>
      </div>
    )
  }

  const planData = plan.plan_data
  const totalTasks = getTotalTasks(planData)
  const overallProgress = progress?.overall_completion_percentage || 0
  const currentWeek = getCurrentWeek()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto p-6">
        {/* Plan Overview */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {plan.title || planData?.title || 'Your Learning Plan'}
              </h1>
              <p className="text-gray-600">
                {planData?.overview || 'Your personalized learning journey'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{overallProgress}%</div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
          </div>

          {/* Simple Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {plan.duration_weeks || planData?.duration || 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Weeks</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {plan.total_hours || planData?.totalHours || 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Total Hours</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {completedTasks.length}
              </div>
              <div className="text-sm text-gray-600">Tasks Done</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">{currentWeek}</div>
              <div className="text-sm text-gray-600">Current Week</div>
            </div>
          </div>
        </div>

        {/* Weekly Breakdown */}
        {planData?.weeks && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <BookOpen className="w-6 h-6 mr-2" />
              Weekly Learning Path
            </h2>

            {planData.weeks.map((week: any, index: number) => {
              const weekNumber = week.week || index + 1
              const isCurrentWeek = weekNumber === currentWeek
              const weekProgress = getWeekProgress(week.tasks || [])

              return (
                <div
                  key={weekNumber}
                  className={`bg-white rounded-xl shadow-sm border p-6 ${isCurrentWeek ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${isCurrentWeek ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                        {weekNumber}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          Week {weekNumber}
                          {isCurrentWeek && <span className="ml-2 text-sm bg-blue-600 text-white px-2 py-1 rounded-full">Current</span>}
                        </h3>
                        <p className="text-gray-600">{week.milestone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{weekProgress}% Complete</div>
                      <div className="text-xs text-gray-500">{week.totalHours || 0}h planned</div>
                    </div>
                  </div>

                  {/* Week Progress Bar */}
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${weekProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <Target className="w-4 h-4 mr-2" />
                      Focus Areas:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {week.focus?.map((skill: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Tasks ({week.tasks?.length || 0}):
                    </h4>

                    <div className="space-y-4">
                      {week.tasks?.map((task: any, i: number) => {
                        const isCompleted = completedTasks.includes(task.id)
                        const primarySkill = week.focus?.[0] || 'General'

                        return (
                          <div
                            key={i}
                            className={`p-4 rounded-lg border transition-all ${isCompleted
                                ? 'bg-green-50 border-green-200'
                                : 'bg-white border-gray-200 hover:border-gray-300'
                              }`}
                          >
                            <div className="flex items-start space-x-3">
                              <input
                                type="checkbox"
                                checked={isCompleted}
                                onChange={() => toggleTaskComplete(task.id)}
                                disabled={updating}
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />

                              <div className="flex-1 min-w-0">
                                <h5 className={`font-semibold text-gray-900 ${isCompleted ? 'line-through text-gray-500' : ''
                                  }`}>
                                  {task.title}
                                </h5>
                                <p className={`text-sm mt-1 ${isCompleted ? 'text-gray-400' : 'text-gray-700'
                                  }`}>
                                  {task.description}
                                </p>

                                <div className="flex items-center space-x-3 mt-2">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {task.estimatedHours}h
                                  </span>
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {task.type}
                                  </span>
                                </div>

                                {/* Study Timer */}
                                {!isCompleted && user && (
                                  <StudyTimer
                                    userId={user?.id}
                                    planId={plan.id}
                                    taskId={task.id}
                                    skillName={week.focus[0] || 'General'}
                                    onSessionComplete={(duration) => {
                                      console.log(`Study session completed: ${duration} minutes`)
                                      // Optionally refresh progress data
                                    }}
                                  />
                                )}

                                {/* Learning Resources */}
                                <LearningResources
                                  skillName={primarySkill}
                                  taskId={task.id}
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-8 flex justify-center space-x-4">
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            Back to Dashboard
          </Button>
          <Button onClick={() => router.push('/jobs')} className="bg-blue-600 hover:bg-blue-700">
            Browse Jobs
          </Button>
        </div>
      </div>
    </div>
  )
}