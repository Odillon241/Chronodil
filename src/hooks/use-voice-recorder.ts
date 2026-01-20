'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface UseVoiceRecorderOptions {
  maxDuration?: number // en secondes, par défaut 5 minutes
  onDurationLimit?: () => void
}

interface UseVoiceRecorderReturn {
  isRecording: boolean
  isPaused: boolean
  duration: number
  audioBlob: Blob | null
  audioUrl: string | null
  error: string | null
  startRecording: () => Promise<void>
  stopRecording: () => void
  pauseRecording: () => void
  resumeRecording: () => void
  cancelRecording: () => void
  clearRecording: () => void
}

/**
 * Hook pour l'enregistrement vocal avec MediaRecorder API
 *
 * @param options - Options de configuration
 * @returns État et fonctions de contrôle de l'enregistrement
 */
export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}): UseVoiceRecorderReturn {
  const { maxDuration = 300, onDurationLimit } = options // 5 minutes par défaut

  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const pausedDurationRef = useRef<number>(0)

  // Nettoyer l'URL de l'audio précédent quand on en crée un nouveau
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  // Timer pour la durée
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now() - pausedDurationRef.current * 1000
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setDuration(elapsed)

      // Vérifier la limite de durée
      if (elapsed >= maxDuration) {
        onDurationLimit?.()
        stopRecording()
      }
    }, 100)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxDuration, onDurationLimit])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Démarrer l'enregistrement
  const startRecording = useCallback(async () => {
    try {
      setError(null)
      setAudioBlob(null)
      setAudioUrl(null)
      chunksRef.current = []
      pausedDurationRef.current = 0

      // Demander la permission du microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      streamRef.current = stream

      // Déterminer le meilleur format supporté
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : 'audio/wav'

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setAudioBlob(blob)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)

        // Libérer le microphone
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      mediaRecorder.onerror = () => {
        setError("Erreur lors de l'enregistrement")
        setIsRecording(false)
        stopTimer()
      }

      // Démarrer l'enregistrement avec des chunks de 1 seconde
      mediaRecorder.start(1000)
      setIsRecording(true)
      setIsPaused(false)
      startTimer()
    } catch (err) {
      console.error("Erreur d'accès au microphone:", err)
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError(
            "Permission du microphone refusée. Veuillez l'autoriser dans les paramètres de votre navigateur.",
          )
        } else if (err.name === 'NotFoundError') {
          setError('Aucun microphone détecté sur votre appareil.')
        } else {
          setError("Erreur d'accès au microphone: " + err.message)
        }
      } else {
        setError("Erreur inattendue lors de l'accès au microphone.")
      }
    }
  }, [startTimer, stopTimer])

  // Arrêter l'enregistrement
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      stopTimer()
    }
  }, [isRecording, stopTimer])

  // Mettre en pause
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      pausedDurationRef.current = duration
      stopTimer()
    }
  }, [isRecording, isPaused, duration, stopTimer])

  // Reprendre
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      startTimer()
    }
  }, [isRecording, isPaused, startTimer])

  // Annuler l'enregistrement
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    chunksRef.current = []
    setIsRecording(false)
    setIsPaused(false)
    setDuration(0)
    setAudioBlob(null)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioUrl(null)
    stopTimer()
  }, [audioUrl, stopTimer])

  // Effacer l'enregistrement terminé
  const clearRecording = useCallback(() => {
    setAudioBlob(null)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioUrl(null)
    setDuration(0)
    setError(null)
  }, [audioUrl])

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      stopTimer()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [stopTimer])

  return {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    clearRecording,
  }
}

/**
 * Formater la durée en MM:SS
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
