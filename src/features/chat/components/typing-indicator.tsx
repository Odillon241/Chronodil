'use client'

import { motion } from 'motion/react'
import { UserAvatar } from '@/components/ui/user-avatar'
import { cn } from '@/lib/utils'

interface TypingIndicatorProps {
  users: {
    id: string
    name: string
    avatar?: string | null
  }[]
  className?: string
}

export function TypingIndicator({ users, className }: TypingIndicatorProps) {
  if (users.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className={cn('flex items-center gap-2 px-4 py-2', className)}
    >
      {/* Avatars */}
      <div className="flex -space-x-2">
        {users.slice(0, 3).map((user) => (
          <UserAvatar
            key={user.id}
            name={user.name}
            avatar={user.avatar}
            size="xs"
            className="border-2 border-background"
          />
        ))}
      </div>

      {/* Texte de saisie */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <span className="font-medium">
          {users.length === 1
            ? users[0].name
            : users.length === 2
              ? `${users[0].name} et ${users[1].name}`
              : `${users[0].name} et ${users.length - 1} autres`}
        </span>
        <span>{users.length === 1 ? "est en train d'écrire" : "sont en train d'écrire"}</span>

        {/* Animated dots */}
        <div className="flex items-center gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{
                y: [-2, 0, -2],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
              className="w-1 h-1 rounded-full bg-current"
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// Composant d'indicateur de saisie minimaliste dans la bulle de message
export function TypingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="flex items-center gap-2 px-4 py-2"
    >
      <UserAvatar name="..." avatar={null} size="sm" className="shrink-0" />
      <div className="bg-muted/70 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              y: [-3, 0, -3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
            className="w-2 h-2 rounded-full bg-muted-foreground/60"
          />
        ))}
      </div>
    </motion.div>
  )
}
