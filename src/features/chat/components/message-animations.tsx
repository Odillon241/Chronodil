'use client'

import { motion } from 'motion/react'
import { ReactNode } from 'react'

interface MessageAnimationProps {
  children: ReactNode
  index?: number
  isOwn?: boolean
}

/**
 * Animation fluide pour les messages entrants
 */
export function MessageSlideIn({ children, index = 0, isOwn = false }: MessageAnimationProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
        x: isOwn ? 20 : -20,
        scale: 0.95,
      }}
      animate={{
        opacity: 1,
        y: 0,
        x: 0,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        scale: 0.95,
        transition: { duration: 0.2 },
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        delay: index * 0.05, // Délai progressif pour l'effet cascade
      }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Animation de rebond subtil pour les réactions
 */
export function ReactionBounce({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.9 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 25,
      }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Animation de fondu pour les messages supprimés
 */
export function MessageFadeOut({
  children,
  onAnimationComplete,
}: {
  children: ReactNode
  onAnimationComplete?: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 1, scale: 1 }}
      exit={{
        opacity: 0,
        scale: 0.8,
        height: 0,
        marginTop: 0,
        marginBottom: 0,
      }}
      transition={{ duration: 0.3 }}
      onAnimationComplete={onAnimationComplete}
    >
      {children}
    </motion.div>
  )
}

/**
 * Animation de glissement pour la liste de conversations
 */
export function ConversationSlide({
  children,
  index = 0,
}: {
  children: ReactNode
  index?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        delay: index * 0.03,
      }}
      whileHover={{
        x: 4,
        transition: { duration: 0.2 },
      }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Animation pulsée pour les notifications non lues
 */
export function UnreadPulse({ children }: { children: ReactNode }) {
  return (
    <motion.div
      animate={{
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Animation de survol pour les boutons d'action de message
 */
export function MessageActionHover({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.div>
  )
}
