'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MessageSquare, Send, Users, Hash, Sparkles, Clock } from 'lucide-react'
import { motion } from 'motion/react'

interface ChatEmptyStateProps {
  onNewChat: () => void
}

const suggestions = [
  {
    icon: Users,
    title: 'Message privé',
    description: 'Démarrer une conversation 1-à-1',
    gradient: 'from-blue-500/20 to-blue-500/5',
    iconColor: 'text-blue-500',
  },
  {
    icon: Hash,
    title: 'Créer un canal',
    description: "Canal d'équipe pour collaborer",
    gradient: 'from-purple-500/20 to-purple-500/5',
    iconColor: 'text-purple-500',
  },
  {
    icon: Clock,
    title: 'Messages récents',
    description: 'Reprendre vos conversations',
    gradient: 'from-green-500/20 to-green-500/5',
    iconColor: 'text-green-500',
  },
]

export function ChatEmptyState({ onNewChat }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-8 bg-gradient-to-br from-background via-background to-muted/20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-2xl w-full space-y-8"
      >
        {/* Icon Hero */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="relative mx-auto w-fit"
        >
          <div className="h-28 w-28 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center shadow-lg shadow-primary/10">
            <MessageSquare className="h-14 w-14 text-primary" />
          </div>

          {/* Floating bubbles decoration */}
          <motion.div
            animate={{ y: [-3, 3, -3] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="absolute -top-2 -right-2 h-10 w-10 rounded-full bg-primary/10 backdrop-blur-sm flex items-center justify-center border border-primary/20"
          >
            <Send className="h-5 w-5 text-primary/60" />
          </motion.div>
          <motion.div
            animate={{ y: [3, -3, 3] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            className="absolute -bottom-1 -left-3 h-8 w-8 rounded-full bg-primary/10 backdrop-blur-sm flex items-center justify-center border border-primary/20"
          >
            <Users className="h-4 w-4 text-primary/60" />
          </motion.div>
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="absolute -top-4 -left-4 h-6 w-6 rounded-full bg-primary/10 backdrop-blur-sm flex items-center justify-center border border-primary/20"
          >
            <Sparkles className="h-3 w-3 text-primary/60" />
          </motion.div>
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">
            Bienvenue dans la messagerie
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
            Collaborez en temps réel avec vos collègues. Créez des conversations, partagez des idées
            et restez connecté à votre équipe.
          </p>
        </motion.div>

        {/* Suggestions Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4"
        >
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Card className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 border-muted/50 bg-gradient-to-br from-background to-muted/5">
                <div className="space-y-2">
                  <div
                    className={`h-12 w-12 rounded-lg bg-gradient-to-br ${suggestion.gradient} flex items-center justify-center mx-auto`}
                  >
                    <suggestion.icon className={`h-6 w-6 ${suggestion.iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-sm">{suggestion.title}</h3>
                  <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <Button
            onClick={onNewChat}
            size="lg"
            className="gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 hover:scale-105"
          >
            <MessageSquare className="h-5 w-5" />
            Démarrer une conversation
          </Button>

          {/* Keyboard shortcut hint */}
          <p className="text-xs text-muted-foreground/60 flex items-center justify-center gap-2">
            <span>Raccourci clavier :</span>
            <kbd className="px-2 py-1 rounded bg-muted text-muted-foreground text-[10px] font-mono border border-muted-foreground/20 shadow-sm">
              Alt + N
            </kbd>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
