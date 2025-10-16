"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Task {
  id: string;
  name: string;
  reminderDate: Date | string | null;
  reminderTime: string | null;
  soundEnabled: boolean;
}

interface UseTaskRemindersProps {
  tasks: Task[];
}

export function useTaskReminders({ tasks }: UseTaskRemindersProps) {
  const [checkedReminders, setCheckedReminders] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialiser l'audio pour la notification sonore
    if (typeof window !== "undefined" && !audioRef.current) {
      audioRef.current = new Audio();
      // Utiliser un son système ou générer un beep
      audioRef.current.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVKzo7KpZEwpMouPzwW8eBS+Ezffajz0HGWu87t+dUA0PUqvm7q1dFAhHnOLysHAcBi+C0PPXiTQFH2274uGcSw0PUaru7q5fEwlJnt/xsXEaBi2A0PPZjj0HGmu77uGYSA0PUqrp7q9fEQhJnt/ws3EaByyA0fPYjj0HGWu77uCZSA0OUqvo7rBfEQhKn+Dws3AaBi2A0fLZjT0HGGu77N+aSA0OUars7rBgEghHnOHxsnIbBzGC0vHYjToGG2u56N+aSQwOVKvt7bBhEQdKod/xs3IbBjGA0fHYizwGGmu56d+YSQsOUqrr7a9hEQdKnuDxsnEbBjKC0fHajDwGGmy56d+YSQwOUqrs7a9hEQdKn9/xsnEbBjKB0fHaizsGGmy66N6XSQwOUqvs7a5iEgdJnt/xs3IbBjKB0fHaizwGGWy76N6WSAwNUavu7K5iEQhKn9/wsnEbBjKB0PHaizsGGmy66d+YSQwOUqrs7K9iEQhJneDwsnEbBjKB0PHaizsGGmy66d+YSQwOU6rs7K9iEQhJnN/wsnEbBjKB0PHaizsGGmy66d+YSQwNUqvs7K9hEQdKnuDws3IbBjGC0fHaizsGGmy66t+YSQwNU6rs7K9hEQdKneHws3IaBjGC0fHaizsGGmy66t+YSAwNU6vt7K9hEQdKneHws3IaBjGC0vHZizwGG2y76t+ZSAwNU6vt7K9hEQdKneHxs3IbBjGC0vHZizwGG2y76t+ZSAwNU6vt7K9hEQdKneHxs3IbBjGB0fHZjDwGG2y76t+aSQwNU6vt7K9hEQdKneHxs3IbBjGB0fHZjDwGG2y76t+aSQwNU6vt7K9hEQdKneDxs3IbBjGB0fHZjDwGG2y76t+aSQwNU6vt7K9hEQdKneDxs3IbBjGB0fHZjDwGG2y76t+aSQwNU6vt7K9hEQdKneDxs3IbBjGB0fHZjDwGG2y76t+aSQwNU6vt7K9hEQdKneDxs3IbBjGB0fHZjDwGG2y76t+aSQwNU6vt7K9hEQdKneDxs3IbBjGB0fHZjDwGG2y76t+aSQwNU6vt7K9hEQdKneDxs3IbBjGB0fHZjDwGG2y76t+aSQwNU6vt7K9hEQdKneDxs3IbBjGB0fHZjDwGG2y76t+aSQwNU6vt7K9hEQdKneDxs3IbBjGB0fHZjDwGG2y76t+aSQwNU6vt7K9hEQdKneDxs3IbBjGB0fHZjDwGG2y76t+aSQwNU6vt7K9hEQdKneDxs3IbBjGB0fHZjDwGG2y76t+aSQwNU6vt7K9hEQdKneDxs3IbBjGB0fHZjDwGG2y76t+aSQwNU6vt7K9hEQdKneDxs3IbBjGB0fHZjDwGG2y76t+aSQwNU6vt7K9hEQdKneDxs3IbBjGB0fHZjDwGG2y76t+aSQwNU6vt7K9hEQdKneDxs3IbBjGB0fHZjDwGG2y76t+aSQwNU6vt7K9hEQdKneDxs3IbBjGB0fHZjDwGG2y76t+aSQwNU6vt7K9hEQdKneDxs3IbBjGB0fHZjDwGG2y76t+aSQwNU6vt7K9hEQdKneDxs3IbBjGB0fHZjDwGG2y76t+aSQwNU6vt7K9hEQdKneDxs3IbBjGB0fHZjDwGG2y76t+aSQwNU6vt7K9h";
    }

    const checkReminders = () => {
      const now = new Date();
      const currentDate = now.toISOString().split("T")[0];
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM

      tasks.forEach((task) => {
        if (!task.reminderDate || !task.reminderTime) return;

        const reminderDate =
          typeof task.reminderDate === "string"
            ? new Date(task.reminderDate)
            : task.reminderDate;
        const reminderDateStr = reminderDate.toISOString().split("T")[0];

        // Vérifier si c'est le bon jour et la bonne heure
        if (
          reminderDateStr === currentDate &&
          task.reminderTime === currentTime &&
          !checkedReminders.has(task.id)
        ) {
          // Marquer comme vérifié pour éviter les notifications répétées
          setCheckedReminders((prev) => new Set(prev).add(task.id));

          // Afficher la notification toast
          toast.info(`Rappel: ${task.name}`, {
            description: "Il est temps de travailler sur cette tâche !",
            duration: 10000,
          });

          // Jouer le son si activé
          if (task.soundEnabled && audioRef.current) {
            audioRef.current.play().catch((err) => {
              console.error("Erreur lors de la lecture du son:", err);
            });
          }

          // Demander la permission pour les notifications système
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`Rappel: ${task.name}`, {
              body: "Il est temps de travailler sur cette tâche !",
              icon: "/icon.svg",
            });
          }
        }
      });
    };

    // Vérifier toutes les minutes
    const interval = setInterval(checkReminders, 60000);

    // Vérifier immédiatement au montage
    checkReminders();

    // Demander la permission pour les notifications (si pas encore fait)
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => clearInterval(interval);
  }, [tasks, checkedReminders]);

  return null;
}

