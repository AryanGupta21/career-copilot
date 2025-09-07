//Step 2: Create /src/lib/analytics-service.ts (NEW FILE)

import { supabase } from './supabase'

export interface StudySession {
  id?: string
  user_id: string
  plan_id: string
  task_id: string
  skill_name: string
  start_time: string
  end_time?: string
  duration_minutes?: number
  session_type: 'study' | 'practice' | 'project' | 'reading'
  notes?: string
}

export interface AnalyticsData {
  currentStreak: number
  longestStreak: number
  totalStudyMinutes: number
  weeklyStudyMinutes: Record<string, number>
  learningVelocity: number
  averageSessionDuration: number
  completedTasksThisWeek: number
  studyGoalProgress: number
}

export class AnalyticsService {
  static async startStudySession(
    userId: string,
    planId: string,
    taskId: string,
    skillName: string,
    sessionType: StudySession['session_type'] = 'study'
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: userId,
          plan_id: planId,
          task_id: taskId,
          skill_name: skillName,
          start_time: new Date().toISOString(),
          session_type: sessionType
        })
        .select('id')
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('Error starting study session:', error)
      return null
    }
  }

  static async endStudySession(sessionId: string, notes?: string): Promise<boolean> {
    try {
      const endTime = new Date()
      
      // Get session start time
      const { data: session, error: fetchError } = await supabase
        .from('study_sessions')
        .select('start_time')
        .eq('id', sessionId)
        .single()

      if (fetchError) throw fetchError

      const startTime = new Date(session.start_time)
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000)

      // Update session with end time and duration
      const { error } = await supabase
        .from('study_sessions')
        .update({
          end_time: endTime.toISOString(),
          duration_minutes: durationMinutes,
          notes: notes
        })
        .eq('id', sessionId)

      if (error) throw error

      // Update user progress analytics
      await this.updateUserAnalytics(session, durationMinutes)
      
      return true
    } catch (error) {
      console.error('Error ending study session:', error)
      return false
    }
  }

  private static async updateUserAnalytics(session: any, durationMinutes: number) {
    try {
      // Get current user progress
      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', session.user_id)
        .single()

      if (progressError) throw progressError

      const today = new Date().toISOString().split('T')[0]
      const currentWeek = this.getWeekKey(new Date())

      // Calculate study streak
      const lastStudyDate = progress.last_study_date
      const { currentStreak, longestStreak } = this.calculateStreak(
        lastStudyDate,
        today,
        progress.study_streak_current || 0,
        progress.study_streak_longest || 0
      )

      // Update weekly study minutes
      const weeklyMinutes = progress.weekly_study_minutes || {}
      weeklyMinutes[currentWeek] = (weeklyMinutes[currentWeek] || 0) + durationMinutes

      // Calculate learning velocity (tasks per week over last 4 weeks)
      const velocity = await this.calculateLearningVelocity(session.user_id)

      // Update progress record
      const { error: updateError } = await supabase
        .from('user_progress')
        .update({
          study_streak_current: currentStreak,
          study_streak_longest: longestStreak,
          total_study_minutes: (progress.total_study_minutes || 0) + durationMinutes,
          last_study_date: today,
          weekly_study_minutes: weeklyMinutes,
          learning_velocity: velocity,
          updated_at: new Date().toISOString()
        })
        .eq('id', progress.id)

      if (updateError) throw updateError
    } catch (error) {
      console.error('Error updating user analytics:', error)
    }
  }

  private static calculateStreak(
    lastStudyDate: string | null,
    todayDate: string,
    currentStreak: number,
    longestStreak: number
  ): { currentStreak: number, longestStreak: number } {
    if (!lastStudyDate) {
      return { currentStreak: 1, longestStreak: Math.max(1, longestStreak) }
    }

    const lastDate = new Date(lastStudyDate)
    const today = new Date(todayDate)
    const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000))

    let newCurrentStreak = currentStreak
    
    if (daysDiff === 0) {
      // Same day, don't change streak
      newCurrentStreak = currentStreak
    } else if (daysDiff === 1) {
      // Consecutive day, increase streak
      newCurrentStreak = currentStreak + 1
    } else {
      // Streak broken, reset to 1
      newCurrentStreak = 1
    }

    const newLongestStreak = Math.max(longestStreak, newCurrentStreak)

    return { currentStreak: newCurrentStreak, longestStreak: newLongestStreak }
  }

  private static async calculateLearningVelocity(userId: string): Promise<number> {
    try {
      // Get completed tasks in last 4 weeks
      const fourWeeksAgo = new Date()
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

      const { data: sessions, error } = await supabase
        .from('study_sessions')
        .select('task_id, created_at')
        .eq('user_id', userId)
        .gte('created_at', fourWeeksAgo.toISOString())

      if (error) throw error

      // Count unique tasks completed (tasks with study sessions)
      const uniqueTasks = new Set(sessions?.map(s => s.task_id) || [])
      const tasksPerWeek = uniqueTasks.size / 4

      return Math.round(tasksPerWeek * 100) / 100 // Round to 2 decimal places
    } catch (error) {
      console.error('Error calculating learning velocity:', error)
      return 0
    }
  }

  private static getWeekKey(date: Date): string {
    const year = date.getFullYear()
    const weekNumber = this.getWeekNumber(date)
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`
  }

  private static getWeekNumber(date: Date): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1)
    const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
    return Math.ceil(dayOfYear / 7)
  }

  static async getAnalyticsData(userId: string, planId?: string): Promise<AnalyticsData | null> {
    try {
      // Get user progress data
      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (progressError) throw progressError

      // Get recent study sessions for average duration
      const { data: sessions, error: sessionsError } = await supabase
        .from('study_sessions')
        .select('duration_minutes, created_at, task_id')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .not('duration_minutes', 'is', null)

      if (sessionsError) throw sessionsError

      // Calculate average session duration
      const avgDuration = sessions && sessions.length > 0
        ? Math.round(sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / sessions.length)
        : 0

      // Get this week's completed tasks
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      startOfWeek.setHours(0, 0, 0, 0)

      const thisWeekSessions = sessions?.filter(s => 
        new Date(s.created_at) >= startOfWeek
      ) || []

      const completedTasksThisWeek = new Set(thisWeekSessions.map(s => s.task_id)).size

      // Get user's weekly study goal
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('study_hours_per_week')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError

      const weeklyGoalMinutes = (profile.study_hours_per_week || 10) * 60
      const currentWeek = this.getWeekKey(new Date())
      const weeklyMinutes = progress.weekly_study_minutes || {}
      const thisWeekMinutes = weeklyMinutes[currentWeek] || 0
      const studyGoalProgress = Math.min(Math.round((thisWeekMinutes / weeklyGoalMinutes) * 100), 100)

      return {
        currentStreak: progress.study_streak_current || 0,
        longestStreak: progress.study_streak_longest || 0,
        totalStudyMinutes: progress.total_study_minutes || 0,
        weeklyStudyMinutes: weeklyMinutes,
        learningVelocity: progress.learning_velocity || 0,
        averageSessionDuration: avgDuration,
        completedTasksThisWeek,
        studyGoalProgress
      }
    } catch (error) {
      console.error('Error getting analytics data:', error)
      return null
    }
  }
}