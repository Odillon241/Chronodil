import { WebSocketServer, WebSocket } from 'ws'
import { IncomingMessage } from 'http'
import { nanoid } from 'nanoid'
import { prisma } from './db'
import { createSupabaseServerAdminClient } from './supabase-admin'
import {
  WSMessageType,
  WSClientMessage,
  WSServerMessage,
  WSAuthenticateMessage,
  WSJoinConversationMessage,
  WSLeaveConversationMessage,
  WSSendMessageMessage,
  WSTypingMessage,
} from '@/types/websocket'

interface AuthenticatedClient {
  ws: WebSocket
  userId: string
  userName: string
  conversations: Set<string> // IDs des conversations rejointes
}

export class WebSocketManager {
  private wss: WebSocketServer
  private clients: Map<WebSocket, AuthenticatedClient | null>
  private conversationRooms: Map<string, Set<WebSocket>>

  constructor(wss: WebSocketServer) {
    this.wss = wss
    this.clients = new Map()
    this.conversationRooms = new Map()

    this.setupWebSocketServer()
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, _req: IncomingMessage) => {
      console.log('🔌 New WebSocket connection')

      // Initialiser le client comme non authentifié
      this.clients.set(ws, null)

      ws.on('message', async (data: Buffer) => {
        try {
          const message: WSClientMessage = JSON.parse(data.toString())
          await this.handleMessage(ws, message)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
          this.sendError(ws, 'Invalid message format')
        }
      })

      ws.on('close', () => {
        console.log('🔌 WebSocket connection closed')
        this.handleDisconnect(ws)
      })

      ws.on('error', (error) => {
        console.error('WebSocket error:', error)
        this.handleDisconnect(ws)
      })

      // Envoyer un message de bienvenue (optionnel)
      this.send(ws, {
        type: WSMessageType.ERROR,
        timestamp: new Date().toISOString(),
        error: 'Please authenticate first',
        code: 'NOT_AUTHENTICATED',
      })
    })
  }

  private async handleMessage(ws: WebSocket, message: WSClientMessage): Promise<void> {
    switch (message.type) {
      case WSMessageType.AUTHENTICATE:
        await this.handleAuthenticate(ws, message)
        break

      case WSMessageType.JOIN_CONVERSATION:
        await this.handleJoinConversation(ws, message)
        break

      case WSMessageType.LEAVE_CONVERSATION:
        await this.handleLeaveConversation(ws, message)
        break

      case WSMessageType.SEND_MESSAGE:
        await this.handleSendMessage(ws, message)
        break

      case WSMessageType.TYPING_START:
      case WSMessageType.TYPING_STOP:
        await this.handleTyping(ws, message)
        break

      case WSMessageType.PING:
        this.send(ws, {
          type: WSMessageType.PONG,
          timestamp: new Date().toISOString(),
        })
        break

      default:
        this.sendError(ws, 'Unknown message type')
    }
  }

  private async handleAuthenticate(ws: WebSocket, message: WSAuthenticateMessage): Promise<void> {
    try {
      const token = message.token

      if (!token) {
        this.send(ws, {
          type: WSMessageType.AUTH_ERROR,
          timestamp: new Date().toISOString(),
          error: 'Token is required',
        })
        ws.close()
        return
      }

      // Vérifier le token JWT avec Supabase Auth
      const supabase = createSupabaseServerAdminClient()
      const { data: authData, error: authError } = await supabase.auth.getUser(token)

      if (authError || !authData?.user) {
        console.error('WebSocket auth error:', authError?.message || 'Invalid token')
        this.send(ws, {
          type: WSMessageType.AUTH_ERROR,
          timestamp: new Date().toISOString(),
          error: 'Invalid or expired token',
        })
        ws.close()
        return
      }

      const userId = authData.user.id

      // Récupérer les infos utilisateur depuis la base de données
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      })

      if (!user) {
        this.send(ws, {
          type: WSMessageType.AUTH_ERROR,
          timestamp: new Date().toISOString(),
          error: 'User not found',
        })
        ws.close()
        return
      }

      // Authentifier le client
      this.clients.set(ws, {
        ws,
        userId: user.id,
        userName: user.name,
        conversations: new Set(),
      })

      this.send(ws, {
        type: WSMessageType.AUTHENTICATED,
        timestamp: new Date().toISOString(),
        userId: user.id,
        userName: user.name,
      })

      console.log(`✅ User authenticated via Supabase: ${user.name} (${user.id})`)
    } catch (error) {
      console.error('Authentication error:', error)
      this.send(ws, {
        type: WSMessageType.AUTH_ERROR,
        timestamp: new Date().toISOString(),
        error: 'Authentication failed',
      })
      ws.close()
    }
  }

  private async handleJoinConversation(
    ws: WebSocket,
    message: WSJoinConversationMessage,
  ): Promise<void> {
    const client = this.clients.get(ws)
    if (!client) {
      this.sendError(ws, 'Not authenticated')
      return
    }

    try {
      // Vérifier que l'utilisateur est membre de la conversation
      const member = await prisma.conversationMember.findUnique({
        where: {
          conversationId_userId: {
            conversationId: message.conversationId,
            userId: client.userId,
          },
        },
      })

      if (!member) {
        this.sendError(ws, 'Not a member of this conversation')
        return
      }

      // Ajouter le client à la room de la conversation
      if (!this.conversationRooms.has(message.conversationId)) {
        this.conversationRooms.set(message.conversationId, new Set())
      }
      this.conversationRooms.get(message.conversationId)!.add(ws)
      client.conversations.add(message.conversationId)

      this.send(ws, {
        type: WSMessageType.JOINED_CONVERSATION,
        timestamp: new Date().toISOString(),
        conversationId: message.conversationId,
      })

      console.log(`📥 User ${client.userName} joined conversation ${message.conversationId}`)
    } catch (error) {
      console.error('Error joining conversation:', error)
      this.sendError(ws, 'Failed to join conversation')
    }
  }

  private async handleLeaveConversation(
    ws: WebSocket,
    message: WSLeaveConversationMessage,
  ): Promise<void> {
    const client = this.clients.get(ws)
    if (!client) {
      this.sendError(ws, 'Not authenticated')
      return
    }

    const room = this.conversationRooms.get(message.conversationId)
    if (room) {
      room.delete(ws)
      if (room.size === 0) {
        this.conversationRooms.delete(message.conversationId)
      }
    }
    client.conversations.delete(message.conversationId)

    this.send(ws, {
      type: WSMessageType.LEFT_CONVERSATION,
      timestamp: new Date().toISOString(),
      conversationId: message.conversationId,
    })

    console.log(`📤 User ${client.userName} left conversation ${message.conversationId}`)
  }

  private async handleSendMessage(ws: WebSocket, message: WSSendMessageMessage): Promise<void> {
    const client = this.clients.get(ws)
    if (!client) {
      this.sendError(ws, 'Not authenticated')
      return
    }

    try {
      // Vérifier que l'utilisateur est membre de la conversation
      const member = await prisma.conversationMember.findUnique({
        where: {
          conversationId_userId: {
            conversationId: message.conversationId,
            userId: client.userId,
          },
        },
      })

      if (!member) {
        this.send(ws, {
          type: WSMessageType.MESSAGE_ERROR,
          timestamp: new Date().toISOString(),
          error: 'Not a member of this conversation',
        })
        return
      }

      // Créer le message dans la base de données
      const newMessage = await prisma.message.create({
        data: {
          id: nanoid(),
          conversationId: message.conversationId,
          senderId: client.userId,
          content: message.content,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      })

      // Confirmer au sender
      this.send(ws, {
        type: WSMessageType.MESSAGE_SENT,
        timestamp: new Date().toISOString(),
        messageId: newMessage.id,
      })

      // Broadcast le message à tous les membres de la conversation
      this.broadcastToConversation(message.conversationId, {
        type: WSMessageType.NEW_MESSAGE,
        timestamp: new Date().toISOString(),
        message: {
          id: newMessage.id,
          conversationId: newMessage.conversationId,
          senderId: newMessage.User.id,
          senderName: newMessage.User.name,
          senderAvatar: newMessage.User.avatar,
          content: newMessage.content,
          createdAt: newMessage.createdAt.toISOString(),
          attachments: message.attachments,
        },
      })

      console.log(`💬 Message sent by ${client.userName} in conversation ${message.conversationId}`)
    } catch (error) {
      console.error('Error sending message:', error)
      this.send(ws, {
        type: WSMessageType.MESSAGE_ERROR,
        timestamp: new Date().toISOString(),
        error: 'Failed to send message',
      })
    }
  }

  private async handleTyping(ws: WebSocket, message: WSTypingMessage): Promise<void> {
    const client = this.clients.get(ws)
    if (!client) {
      this.sendError(ws, 'Not authenticated')
      return
    }

    const isTyping = message.type === WSMessageType.TYPING_START
    const eventType = isTyping ? WSMessageType.USER_TYPING : WSMessageType.USER_STOPPED_TYPING

    // Broadcast aux autres membres de la conversation
    this.broadcastToConversation(
      message.conversationId,
      {
        type: eventType,
        timestamp: new Date().toISOString(),
        conversationId: message.conversationId,
        userId: client.userId,
        userName: client.userName,
      },
      ws, // Exclure l'expéditeur
    )
  }

  private handleDisconnect(ws: WebSocket): void {
    const client = this.clients.get(ws)
    if (client) {
      // Retirer le client de toutes les rooms
      client.conversations.forEach((conversationId) => {
        const room = this.conversationRooms.get(conversationId)
        if (room) {
          room.delete(ws)
          if (room.size === 0) {
            this.conversationRooms.delete(conversationId)
          }
        }
      })
      console.log(`❌ User ${client.userName} disconnected`)
    }
    this.clients.delete(ws)
  }

  private send(ws: WebSocket, message: WSServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  private sendError(ws: WebSocket, error: string, code?: string): void {
    this.send(ws, {
      type: WSMessageType.ERROR,
      timestamp: new Date().toISOString(),
      error,
      code,
    })
  }

  private broadcastToConversation(
    conversationId: string,
    message: WSServerMessage,
    exclude?: WebSocket,
  ): void {
    const room = this.conversationRooms.get(conversationId)
    if (!room) return

    room.forEach((client) => {
      if (client !== exclude) {
        this.send(client, message)
      }
    })
  }

  public shutdown(): void {
    console.log('🛑 Shutting down WebSocket server...')

    // Fermer toutes les connexions
    this.clients.forEach((_, ws) => {
      ws.close()
    })

    this.clients.clear()
    this.conversationRooms.clear()

    console.log('✅ WebSocket server shut down')
  }
}
