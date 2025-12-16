/**
 * Types pour le système de WebSocket Chat
 */

// Types de messages WebSocket
export enum WSMessageType {
  // Client → Server
  AUTHENTICATE = 'authenticate',
  JOIN_CONVERSATION = 'join_conversation',
  LEAVE_CONVERSATION = 'leave_conversation',
  SEND_MESSAGE = 'send_message',
  TYPING_START = 'typing_start',
  TYPING_STOP = 'typing_stop',
  PING = 'ping',

  // Server → Client
  AUTHENTICATED = 'authenticated',
  AUTH_ERROR = 'auth_error',
  JOINED_CONVERSATION = 'joined_conversation',
  LEFT_CONVERSATION = 'left_conversation',
  NEW_MESSAGE = 'new_message',
  MESSAGE_SENT = 'message_sent',
  MESSAGE_ERROR = 'message_error',
  USER_TYPING = 'user_typing',
  USER_STOPPED_TYPING = 'user_stopped_typing',
  CONVERSATION_UPDATED = 'conversation_updated',
  PONG = 'pong',
  ERROR = 'error',
}

// Message de base
export interface WSMessage {
  type: WSMessageType;
  timestamp: string;
}

// Client → Server messages

export interface WSAuthenticateMessage extends WSMessage {
  type: WSMessageType.AUTHENTICATE;
  token: string; // JWT token ou session token
}

export interface WSJoinConversationMessage extends WSMessage {
  type: WSMessageType.JOIN_CONVERSATION;
  conversationId: string;
}

export interface WSLeaveConversationMessage extends WSMessage {
  type: WSMessageType.LEAVE_CONVERSATION;
  conversationId: string;
}

export interface WSSendMessageMessage extends WSMessage {
  type: WSMessageType.SEND_MESSAGE;
  conversationId: string;
  content: string;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
}

export interface WSTypingMessage extends WSMessage {
  type: WSMessageType.TYPING_START | WSMessageType.TYPING_STOP;
  conversationId: string;
}

export interface WSPingMessage extends WSMessage {
  type: WSMessageType.PING;
}

// Server → Client messages

export interface WSAuthenticatedMessage extends WSMessage {
  type: WSMessageType.AUTHENTICATED;
  userId: string;
  userName: string;
}

export interface WSAuthErrorMessage extends WSMessage {
  type: WSMessageType.AUTH_ERROR;
  error: string;
}

export interface WSJoinedConversationMessage extends WSMessage {
  type: WSMessageType.JOINED_CONVERSATION;
  conversationId: string;
}

export interface WSLeftConversationMessage extends WSMessage {
  type: WSMessageType.LEFT_CONVERSATION;
  conversationId: string;
}

export interface WSNewMessageMessage extends WSMessage {
  type: WSMessageType.NEW_MESSAGE;
  message: {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    senderAvatar: string | null;
    content: string;
    createdAt: string;
    attachments?: Array<{
      name: string;
      url: string;
      type: string;
      size: number;
    }>;
  };
}

export interface WSMessageSentMessage extends WSMessage {
  type: WSMessageType.MESSAGE_SENT;
  messageId: string;
  tempId?: string; // ID temporaire pour correspondre avec le message côté client
}

export interface WSMessageErrorMessage extends WSMessage {
  type: WSMessageType.MESSAGE_ERROR;
  error: string;
  tempId?: string;
}

export interface WSUserTypingMessage extends WSMessage {
  type: WSMessageType.USER_TYPING;
  conversationId: string;
  userId: string;
  userName: string;
}

export interface WSUserStoppedTypingMessage extends WSMessage {
  type: WSMessageType.USER_STOPPED_TYPING;
  conversationId: string;
  userId: string;
}

export interface WSConversationUpdatedMessage extends WSMessage {
  type: WSMessageType.CONVERSATION_UPDATED;
  conversationId: string;
  updateType: 'member_added' | 'member_removed' | 'name_changed' | 'deleted';
}

export interface WSPongMessage extends WSMessage {
  type: WSMessageType.PONG;
}

export interface WSErrorMessage extends WSMessage {
  type: WSMessageType.ERROR;
  error: string;
  code?: string;
}

// Union types pour faciliter le typage
export type WSClientMessage =
  | WSAuthenticateMessage
  | WSJoinConversationMessage
  | WSLeaveConversationMessage
  | WSSendMessageMessage
  | WSTypingMessage
  | WSPingMessage;

export type WSServerMessage =
  | WSAuthenticatedMessage
  | WSAuthErrorMessage
  | WSJoinedConversationMessage
  | WSLeftConversationMessage
  | WSNewMessageMessage
  | WSMessageSentMessage
  | WSMessageErrorMessage
  | WSUserTypingMessage
  | WSUserStoppedTypingMessage
  | WSConversationUpdatedMessage
  | WSPongMessage
  | WSErrorMessage;

// État de connexion WebSocket
export enum WSConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  AUTHENTICATED = 'authenticated',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

// Configuration du client WebSocket
export interface WSClientConfig {
  url: string;
  token: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  reconnectAttempts?: number;
  pingInterval?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onMessage?: (message: WSServerMessage) => void;
}
