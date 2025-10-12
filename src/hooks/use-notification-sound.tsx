"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Hook pour gérer les sons de notification
 * Permet de jouer un son lorsqu'une nouvelle notification arrive
 */
export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [selectedSound, setSelectedSound] = useState<"default" | "soft" | "alert">("default");

  // Charger les préférences depuis le localStorage au montage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEnabled = localStorage.getItem("notification-sound-enabled");
      const savedVolume = localStorage.getItem("notification-sound-volume");
      const savedSound = localStorage.getItem("notification-sound-type");

      if (savedEnabled !== null) {
        setIsEnabled(savedEnabled === "true");
      }
      if (savedVolume !== null) {
        setVolume(parseFloat(savedVolume));
      }
      if (savedSound !== null) {
        setSelectedSound(savedSound as "default" | "soft" | "alert");
      }
    }
  }, []);

  // Initialiser l'élément audio
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Mettre à jour le volume quand il change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  /**
   * Joue un son de notification
   * Utilise soit un fichier audio personnalisé, soit génère un son via Web Audio API
   */
  const playSound = useCallback(
    async (soundType?: "default" | "soft" | "alert") => {
      if (!isEnabled) return;

      const type = soundType || selectedSound;

      try {
        // Essayer de charger le fichier audio personnalisé d'abord
        const soundPath = `/sounds/notification-${type}.mp3`;
        
        if (audioRef.current) {
          audioRef.current.src = soundPath;
          audioRef.current.volume = volume;
          
          // Tenter de jouer le fichier audio
          try {
            await audioRef.current.play();
          } catch (error) {
            // Si le fichier n'existe pas, utiliser Web Audio API pour générer un son
            console.log("Fichier audio non trouvé, génération d'un son via Web Audio API");
            generateBeepSound(type);
          }
        } else {
          generateBeepSound(type);
        }
      } catch (error) {
        console.error("Erreur lors de la lecture du son:", error);
      }
    },
    [isEnabled, volume, selectedSound]
  );

  /**
   * Génère un son de notification en utilisant Web Audio API
   * Différents sons selon le type sélectionné
   */
  const generateBeepSound = useCallback(
    (type: "default" | "soft" | "alert") => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Configuration selon le type de son
        switch (type) {
          case "soft":
            oscillator.frequency.value = 600;
            gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            break;

          case "alert":
            // Son plus urgent avec deux tons
            oscillator.frequency.value = 800;
            gainNode.gain.setValueAtTime(volume * 0.5, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);

            // Deuxième ton
            setTimeout(() => {
              const oscillator2 = audioContext.createOscillator();
              const gainNode2 = audioContext.createGain();
              oscillator2.connect(gainNode2);
              gainNode2.connect(audioContext.destination);
              oscillator2.frequency.value = 1000;
              gainNode2.gain.setValueAtTime(volume * 0.5, audioContext.currentTime);
              gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
              oscillator2.start(audioContext.currentTime);
              oscillator2.stop(audioContext.currentTime + 0.15);
            }, 150);
            break;

          case "default":
          default:
            // Son classique de notification
            oscillator.frequency.value = 700;
            gainNode.gain.setValueAtTime(volume * 0.4, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
            break;
        }
      } catch (error) {
        console.error("Erreur lors de la génération du son:", error);
      }
    },
    [volume]
  );

  /**
   * Active ou désactive les sons de notification
   */
  const toggleSound = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    if (typeof window !== "undefined") {
      localStorage.setItem("notification-sound-enabled", enabled.toString());
    }
  }, []);

  /**
   * Change le volume du son (0 à 1)
   */
  const changeVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    if (typeof window !== "undefined") {
      localStorage.setItem("notification-sound-volume", clampedVolume.toString());
    }
  }, []);

  /**
   * Change le type de son de notification
   */
  const changeSoundType = useCallback((type: "default" | "soft" | "alert") => {
    setSelectedSound(type);
    if (typeof window !== "undefined") {
      localStorage.setItem("notification-sound-type", type);
    }
  }, []);

  /**
   * Teste le son actuellement sélectionné
   */
  const testSound = useCallback(() => {
    playSound();
  }, [playSound]);

  return {
    isEnabled,
    volume,
    selectedSound,
    playSound,
    toggleSound,
    changeVolume,
    changeSoundType,
    testSound,
  };
}

