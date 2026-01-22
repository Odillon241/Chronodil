'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Play, Pause, Mic, AlertCircle } from 'lucide-react'

interface VoiceMessagePlayerProps {
  url: string
  duration?: number
  isCurrentUser?: boolean
  className?: string
}

/**
 * Lecteur audio compact pour les messages vocaux
 * Design moderne inspiré de WhatsApp/Telegram
 */
export function VoiceMessagePlayer({
  url,
  isCurrentUser = false,
  className,
}: VoiceMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Validate URL - must be a non-empty string
  const isValidUrl = typeof url === 'string' && url.length > 0 && url.startsWith('http')

  useEffect(() => {
    // If URL is invalid, set error state immediately
    if (!isValidUrl) {
      console.error('URL audio invalide:', { url, type: typeof url })
      setHasError(true)
      return
    }

    const audio = audioRef.current
    if (!audio) return

    // Reset error state when URL changes
    setHasError(false)
    setIsLoaded(false)

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setIsLoaded(true)
      setHasError(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handleError = () => {
      const error = audio.error
      const errorMessages: Record<number, string> = {
        1: 'Chargement interrompu',
        2: 'Erreur réseau',
        3: 'Erreur de décodage',
        4: 'Format non supporté par ce navigateur',
      }
      const message = error?.code ? errorMessages[error.code] : 'Erreur inconnue'
      // Note: WebM/Opus n'est pas supporté par Safari
      if (error?.code === 4 && url?.includes('.webm')) {
        console.warn(
          'Format WebM non supporté (Safari?). Les nouveaux enregistrements utiliseront MP4.',
        )
      }
      console.error(`Erreur audio: ${message}`, { url, errorCode: error?.code })
      setHasError(true)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = x / rect.width
    audio.currentTime = percent * duration
  }

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={cn('flex items-center gap-2 min-w-[180px] max-w-[280px]', className)}>
      {/* Audio element hidden - only set src if URL is valid */}
      <audio ref={audioRef} src={isValidUrl ? url : undefined} preload="metadata" />

      {/* Icône microphone ou erreur */}
      <div
        className={cn(
          'flex items-center justify-center h-8 w-8 rounded-full shrink-0',
          hasError
            ? 'bg-destructive/20'
            : isCurrentUser
              ? 'bg-primary-foreground/20'
              : 'bg-primary/20',
        )}
      >
        {hasError ? (
          <AlertCircle className="h-4 w-4 text-destructive" />
        ) : (
          <Mic
            className={cn('h-4 w-4', isCurrentUser ? 'text-primary-foreground' : 'text-primary')}
          />
        )}
      </div>

      {/* Progress bar + time */}
      <div className="flex-1 min-w-0">
        {/* Barre de progression cliquable */}
        <div
          className={cn(
            'relative h-1 rounded-full cursor-pointer',
            isCurrentUser ? 'bg-primary-foreground/30' : 'bg-muted-foreground/30',
          )}
          onClick={handleProgressClick}
        >
          <div
            className={cn(
              'absolute h-full rounded-full transition-all duration-100',
              isCurrentUser ? 'bg-primary-foreground' : 'bg-primary',
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Durée ou message d'erreur */}
        <div className="flex justify-between mt-1">
          {hasError ? (
            <span className="text-[10px] text-destructive">Audio indisponible</span>
          ) : (
            <>
              <span
                className={cn(
                  'text-[10px]',
                  isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground',
                )}
              >
                {formatTime(currentTime)}
              </span>
              <span
                className={cn(
                  'text-[10px]',
                  isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground',
                )}
              >
                {isLoaded ? formatTime(duration) : '--:--'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Bouton Play/Pause */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'h-8 w-8 rounded-full shrink-0',
          hasError
            ? 'text-muted-foreground cursor-not-allowed'
            : isCurrentUser
              ? 'text-primary-foreground hover:bg-primary-foreground/20'
              : 'text-primary hover:bg-primary/10',
        )}
        onClick={togglePlay}
        disabled={hasError}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4 fill-current" />
        ) : (
          <Play className="h-4 w-4 fill-current" />
        )}
      </Button>
    </div>
  )
}
