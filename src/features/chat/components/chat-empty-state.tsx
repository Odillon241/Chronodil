"use client";

import { Button } from "@/components/ui/button";
import { MessageSquare, Send, Users } from "lucide-react";
import { motion } from "motion/react";

interface ChatEmptyStateProps {
    onNewChat: () => void;
}

export function ChatEmptyState({ onNewChat }: ChatEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="max-w-md space-y-6"
            >
                {/* Icon */}
                <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    className="relative mx-auto"
                >
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <MessageSquare className="h-12 w-12 text-primary" />
                    </div>

                    {/* Floating bubbles decoration */}
                    <motion.div
                        animate={{ y: [-3, 3, -3] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"
                    >
                        <Send className="h-4 w-4 text-primary/60" />
                    </motion.div>
                    <motion.div
                        animate={{ y: [3, -3, 3] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                        className="absolute -bottom-1 -left-3 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center"
                    >
                        <Users className="h-3 w-3 text-primary/60" />
                    </motion.div>
                </motion.div>

                {/* Text */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-2"
                >
                    <h2 className="text-xl sm:text-2xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        Bienvenue dans la messagerie
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        Sélectionnez une conversation existante ou créez-en une nouvelle pour
                        commencer à échanger avec vos collègues.
                    </p>
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Button
                        onClick={onNewChat}
                        size="lg"
                        className="gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow"
                    >
                        <MessageSquare className="h-5 w-5" />
                        Nouvelle conversation
                    </Button>
                </motion.div>

                {/* Keyboard shortcut hint */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-xs text-muted-foreground/60"
                >
                    Astuce : utilisez{" "}
                    <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-mono">
                        Ctrl + N
                    </kbd>{" "}
                    pour créer rapidement
                </motion.p>
            </motion.div>
        </div>
    );
}
