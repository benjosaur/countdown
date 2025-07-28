import { useEffect, useState } from 'react'

interface TimerProps {
  isRunning: boolean
  onTimeUpdate: (time: number) => void
  reset: boolean
}

export function Timer({ isRunning, onTimeUpdate, reset }: TimerProps) {
  const [time, setTime] = useState(0)

  useEffect(() => {
    if (reset) {
      setTime(0)
      onTimeUpdate(0)
    }
  }, [reset, onTimeUpdate])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning) {
      interval = setInterval(() => {
        setTime(prevTime => {
          const newTime = prevTime + 10
          onTimeUpdate(newTime)
          return newTime
        })
      }, 10)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isRunning, onTimeUpdate])

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const centiseconds = Math.floor((milliseconds % 1000) / 10)

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="text-center">
      <div className="text-4xl font-mono font-bold text-gray-800 mb-2">
        {formatTime(time)}
      </div>
      <div className="text-sm text-gray-500">
        {isRunning ? 'Timer running...' : 'Timer stopped'}
      </div>
    </div>
  )
}