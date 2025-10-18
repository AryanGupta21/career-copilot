///Users/aryangupta/Developer/iexcel-career-tool/src/components/study-timer.tsx


'use client'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Pause, Square, Clock } from 'lucide-react'
import { AnalyticsService } from '@/lib/analytics-service'

interface StudyTimerProps {
  userId: string
  planId: string
  taskId: string
  skillName: string
  onSessionComplete?: (duration: number) => void
}

export default function StudyTimer({ userId, planId, taskId, skillName, onSessionComplete }: StudyTimerProps) {
  const [isActive, setIsActive] = useState(false)
  const [time, setTime] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTime(time => time + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive])

  const startTimer = async () => {
    const newSessionId = await AnalyticsService.startStudySession(
      userId,
      planId,
      taskId,
      skillName,
      'study'
    )
    
    if (newSessionId) {
      setSessionId(newSessionId)
      setIsActive(true)
    }
  }

  const pauseTimer = () => {
    setIsActive(false)
  }

  const stopTimer = async () => {
    setIsActive(false)
    
    if (sessionId) {
      const success = await AnalyticsService.endStudySession(sessionId)
      if (success) {
        const minutes = Math.floor(time / 60)
        onSessionComplete?.(minutes)
        setSessionId(null)
        setTime(0)
      }
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
    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border">
      <div className="flex items-center space-x-2">
        <Clock className="w-4 h-4 text-black" />
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
              <Square className="w-3 h-3" />
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" onClick={pauseTimer} className="bg-yellow-600 hover:bg-yellow-700">
              <Pause className="w-3 h-3" />
            </Button>
            <Button size="sm" onClick={stopTimer} variant="outline">
              <Square className="w-3 h-3" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}