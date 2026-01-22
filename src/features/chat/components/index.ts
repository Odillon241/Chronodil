/**
 * Chat Components - Index des exports
 * Facilite l'importation des composants de chat
 *
 * Usage:
 * import { TypingIndicator, MessageSlideIn, ChatNotificationToast } from '@/features/chat/components'
 */

// Composants existants (déjà utilisés)
export { ChatEmptyState } from './chat-empty-state'
export { ChatMessageBubble } from './chat-message-bubble'
export { ChatMessageInput } from './chat-message-input'
export { VoiceMessagePlayer } from './voice-message-player'
export { VoiceRecorderButton } from './voice-recorder-button'

// Nouveaux composants d'UI
export { TypingIndicator, TypingBubble } from './typing-indicator'
export {
  MessageSlideIn,
  ReactionBounce,
  MessageFadeOut,
  ConversationSlide,
  UnreadPulse,
  MessageActionHover,
} from './message-animations'
export {
  ChatNotificationToast,
  ChatNotificationToastCompact,
  UnreadBadgeAnimation,
} from './chat-notification-toast'
export { ChatHeaderEnhanced } from './chat-header-enhanced'
export {
  ChatKeyboardHints,
  ChatKeyboardHintsCompact,
  useKeyboardHintsToggle,
} from './chat-keyboard-hints'

// Types (si nécessaire)
export type { ChatMessageBubbleProps } from './chat-message-bubble'
export type { ChatMessageInputProps } from './chat-message-input'
