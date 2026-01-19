"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Mic,
    Square,
    X,
    Send,
    Pause,
    Play,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useVoiceRecorder, formatDuration } from "@/hooks/use-voice-recorder";

interface VoiceRecorderButtonProps {
    onRecordingComplete: (audioFile: File) => void;
    disabled?: boolean;
    className?: string;
}

/**
 * Composant bouton d'enregistrement vocal pour le chat
 * 
 * États :
 * - Idle : Bouton microphone
 * - Recording : Animation + timer + boutons pause/stop
 * - Preview : Lecteur audio + boutons annuler/envoyer
 */
export function VoiceRecorderButton({
    onRecordingComplete,
    disabled = false,
    className,
}: VoiceRecorderButtonProps) {
    const [showPreview, setShowPreview] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    const {
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
    } = useVoiceRecorder({
        maxDuration: 300, // 5 minutes
        onDurationLimit: () => {
            toast.info("Durée maximale atteinte (5 minutes)");
        },
    });

    // Afficher l'erreur
    useEffect(() => {
        if (error) {
            toast.error(error);
        }
    }, [error]);

    // Afficher la prévisualisation quand l'enregistrement est terminé
    useEffect(() => {
        if (audioBlob && !isRecording) {
            setShowPreview(true);
        }
    }, [audioBlob, isRecording]);

    const handleStartRecording = async () => {
        await startRecording();
    };

    const handleStopRecording = () => {
        stopRecording();
    };

    const handleCancel = () => {
        cancelRecording();
        setShowPreview(false);
    };

    const handleSend = () => {
        if (audioBlob) {
            // Créer un fichier à partir du blob
            const extension = audioBlob.type.includes("webm") ? "webm" :
                audioBlob.type.includes("mp4") ? "m4a" : "wav";
            const fileName = `voice-message-${Date.now()}.${extension}`;
            const audioFile = new File([audioBlob], fileName, { type: audioBlob.type });

            onRecordingComplete(audioFile);
            clearRecording();
            setShowPreview(false);
        }
    };

    // Mode prévisualisation
    if (showPreview && audioUrl) {
        return (
            <div className={cn("flex items-center gap-2", className)}>
                {/* Lecteur audio compact */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
                    <audio ref={audioRef} src={audioUrl} className="hidden" />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                            if (audioRef.current) {
                                if (audioRef.current.paused) {
                                    audioRef.current.play();
                                } else {
                                    audioRef.current.pause();
                                }
                            }
                        }}
                    >
                        <Play className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground min-w-[40px]">
                        {formatDuration(duration)}
                    </span>
                    {/* Barre de progression simple */}
                    <div className="w-16 h-1 bg-muted-foreground/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: "100%" }}
                        />
                    </div>
                </div>

                {/* Bouton annuler */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={handleCancel}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>

                {/* Bouton envoyer */}
                <Button
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={handleSend}
                >
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    // Mode enregistrement
    if (isRecording) {
        return (
            <div className={cn("flex items-center gap-2", className)}>
                {/* Indicateur d'enregistrement */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 rounded-full">
                    {/* Point rouge animé */}
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                    </span>

                    {/* Timer */}
                    <span className="text-sm font-mono text-destructive min-w-[45px]">
                        {formatDuration(duration)}
                    </span>
                </div>

                {/* Bouton Pause/Reprendre */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={isPaused ? resumeRecording : pauseRecording}
                >
                    {isPaused ? (
                        <Play className="h-4 w-4" />
                    ) : (
                        <Pause className="h-4 w-4" />
                    )}
                </Button>

                {/* Bouton Annuler */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={handleCancel}
                >
                    <X className="h-4 w-4" />
                </Button>

                {/* Bouton Stop/Terminer */}
                <Button
                    size="icon"
                    className="h-8 w-8 rounded-full bg-destructive hover:bg-destructive/90"
                    onClick={handleStopRecording}
                >
                    <Square className="h-3 w-3 fill-current" />
                </Button>
            </div>
        );
    }

    // Mode idle - Bouton microphone
    return (
        <Button
            variant="ghost"
            size="icon"
            className={cn("h-9 w-9 shrink-0", className)}
            onClick={handleStartRecording}
            disabled={disabled}
            title="Enregistrer un message vocal"
        >
            <Mic className="h-5 w-5" />
        </Button>
    );
}
