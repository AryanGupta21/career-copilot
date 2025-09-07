///Users/aryangupta/Developer/iexcel-career-tool/src/components/analytics-dashboard.tsx

'use client'
import { useEffect, useState } from 'react'
import { AnalyticsService, type AnalyticsData } from '@/lib/analytics-service'
import { TrendingUp, Clock, Target, Flame, BarChart3 } from 'lucide-react'

interface AnalyticsDashboardProps {
  userId: string
  planId?: string
}

export default function AnalyticsDashboard({ userId, planId }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [userId, planId])

  const loadAnalytics = async () => {
    setLoading(true)
    const data = await AnalyticsService.getAnalyticsData(userId, planId)
    setAnalytics(data)
    setLoading(false)
  }

  const formatStudyTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow-sm border animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
        <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">No analytics data available yet. Start studying to see insights!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Current Streak */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">Study Streak</h3>
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {analytics.currentStreak}
          </div>
          <p className="text-xs text-gray-600">
            days • longest: {analytics.longestStreak}
          </p>
        </div>

        {/* Total Study Time */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">Total Study Time</h3>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {formatStudyTime(analytics.totalStudyMinutes)}
          </div>
          <p className="text-xs text-gray-600">
            avg: {formatStudyTime(analytics.averageSessionDuration)} per session
          </p>
        </div>

        {/* Learning Velocity */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">Learning Velocity</h3>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-600">
            {analytics.learningVelocity}
          </div>
          <p className="text-xs text-gray-600">
            tasks per week
          </p>
        </div>

        {/* Weekly Goal Progress */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">This Week's Goal</h3>
            <Target className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {analytics.studyGoalProgress}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(analytics.studyGoalProgress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Weekly Study Pattern */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="font-semibold text-gray-900 mb-4">Weekly Study Pattern</h3>
        <div className="space-y-2">
          {Object.entries(analytics.weeklyStudyMinutes)
            .slice(-4) // Show last 4 weeks
            .map(([week, minutes]) => (
              <div key={week} className="flex items-center space-x-3">
                <span className="text-sm text-gray-600 w-16">{week}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((minutes / 600) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 w-12">
                  {formatStudyTime(minutes)}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}