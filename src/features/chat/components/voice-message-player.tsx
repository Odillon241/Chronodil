"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Play, Pause, Mic } from "lucide-react";

interface VoiceMessagePlayerProps {
    url: string;
    duration?: number;
    isCurrentUser?: boolean;
    className?: string;
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
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
            setIsLoaded(true);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        const handleError = () => {
            console.error("Erreur de chargement audio");
        };

        audio.addEventListener("loadedmetadata", handleLoadedMetadata);
        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("error", handleError);

        return () => {
            audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
            audio.removeEventListener("timeupdate", handleTimeUpdate);
            audio.removeEventListener("ended", handleEnded);
            audio.removeEventListener("error", handleError);
        };
    }, []);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        if (!audio || !duration) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = x / rect.width;
        audio.currentTime = percent * duration;
    };

    const formatTime = (seconds: number): string => {
        if (!isFinite(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div
            className={cn(
                "flex items-center gap-2 min-w-[180px] max-w-[280px]",
                className
            )}
        >
            {/* Audio element hidden */}
            <audio ref={audioRef} src={url} preload="metadata" />

            {/* Icône microphone */}
            <div
                className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-full shrink-0",
                    isCurrentUser
                        ? "bg-primary-foreground/20"
                        : "bg-primary/20"
                )}
            >
                <Mic className={cn(
                    "h-4 w-4",
                    isCurrentUser ? "text-primary-foreground" : "text-primary"
                )} />
            </div>

            {/* Progress bar + time */}
            <div className="flex-1 min-w-0">
                {/* Barre de progression cliquable */}
                <div
                    className={cn(
                        "relative h-1 rounded-full cursor-pointer",
                        isCurrentUser ? "bg-primary-foreground/30" : "bg-muted-foreground/30"
                    )}
                    onClick={handleProgressClick}
                >
                    <div
                        className={cn(
                            "absolute h-full rounded-full transition-all duration-100",
                            isCurrentUser ? "bg-primary-foreground" : "bg-primary"
                        )}
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Durée */}
                <div className="flex justify-between mt-1">
                    <span
                        className={cn(
                            "text-[10px]",
                            isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}
                    >
                        {formatTime(currentTime)}
                    </span>
                    <span
                        className={cn(
                            "text-[10px]",
                            isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}
                    >
                        {isLoaded ? formatTime(duration) : "--:--"}
                    </span>
                </div>
            </div>

            {/* Bouton Play/Pause */}
            <Button
                variant="ghost"
                size="icon"
                className={cn(
                    "h-8 w-8 rounded-full shrink-0",
                    isCurrentUser
                        ? "text-primary-foreground hover:bg-primary-foreground/20"
                        : "text-primary hover:bg-primary/10"
                )}
                onClick={togglePlay}
            >
                {isPlaying ? (
                    <Pause className="h-4 w-4 fill-current" />
                ) : (
                    <Play className="h-4 w-4 fill-current" />
                )}
            </Button>
        </div>
    );
}
