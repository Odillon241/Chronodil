import { Server as SocketIOServer, Socket } from 'socket.io'
import { nanoid } from 'nanoid'
import { prisma } from './db'
import {
  WSMessageType,
  WSJoinConversationMessage,
  WSLeaveConversationMessage,
  WSSendMessageMessage,
  WSTypingMessage,
} from '@/types/websocket'

interface AuthenticatedSocket extends Socket {
  userId?: string
  userName?: string
}

export class SocketIOManager {
  private io: SocketIOServer

  constructor(io: SocketIOServer) {
    this.io = io
    this.setupSocketIO()
  }

  private setupSocketIO(): void {
    // Middleware d'authentification
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization

      if (!token) {
        return next(new Error('Authentication required'))
      }

      try {
        // TODO: Implémenter la vérification du token JWT
        // Pour l'instant, on utilise une authentification simplifiée (DEV ONLY)
        const userId = token

        // Récupérer les infos utilisateur depuis la base de données
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true },
        })

        if (!user) {
          return next(new Error('User not found'))
        }

        // Attacher les infos utilisateur au socket
        socket.userId = user.id
        socket.userName = user.name

        next()
      } catch (error) {
        console.error('Authentication error:', error)
        next(new Error('Authentication failed'))
      }
    })

    // Gérer les connexions
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`🔌 New Socket.IO connection: ${socket.userName} (${socket.userId})`)

      // Événement: Rejoindre une conversation
      socket.on(WSMessageType.JOIN_CONVERSATION, async (data: WSJoinConversationMessage) => {
        await this.handleJoinConversation(socket, data)
      })

      // Événement: Quitter une conversation
      socket.on(WSMessageType.LEAVE_CONVERSATION, async (data: WSLeaveConversationMessage) => {
        await this.handleLeaveConversation(socket, data)
      })

      // Événement: Envoyer un message
      socket.on(WSMessageType.SEND_MESSAGE, async (data: WSSendMessageMessage) => {
        await this.handleSendMessage(socket, data)
      })

      // Événement: Commencer à taper
      socket.on(WSMessageType.TYPING_START, (data: WSTypingMessage) => {
        this.handleTypingStart(socket, data)
      })

      // Événement: Arrêter de taper
      socket.on(WSMessageType.TYPING_STOP, (data: WSTypingMessage) => {
        this.handleTypingStop(socket, data)
      })

      // Événement: Ping (heartbeat)
      socket.on(WSMessageType.PING, () => {
        socket.emit(WSMessageType.PONG, {
          type: WSMessageType.PONG,
          timestamp: new Date().toISOString(),
        })
      })

      // Événement: Déconnexion
      socket.on('disconnect', (reason) => {
        console.log(`❌ Socket.IO disconnected: ${socket.userName} (${reason})`)
      })

      // Événement: Erreur
      socket.on('error', (error) => {
        console.error(`⚠️ Socket.IO error for ${socket.userName}:`, error)
      })
    })

    console.log('✅ Socket.IO event handlers registered')
  }

  private async handleJoinConversation(
    socket: AuthenticatedSocket,
    data: WSJoinConversationMessage,
  ): Promise<void> {
    try {
      // Vérifier que l'utilisateur est membre de la conversation
      const member = await prisma.conversationMember.findUnique({
        where: {
          conversationId_userId: {
            conversationId: data.conversationId,
            userId: socket.userId!,
          },
        },
      })

      if (!member) {
        socket.emit(WSMessageType.ERROR, {
          type: WSMessageType.ERROR,
          timestamp: new Date().toISOString(),
          error: 'Not a member of this conversation',
          code: 'NOT_MEMBER',
        })
        return
      }

      // Rejoindre la room Socket.IO
      await socket.join(data.conversationId)

      socket.emit(WSMessageType.JOINED_CONVERSATION, {
        type: WSMessageType.JOINED_CONVERSATION,
        timestamp: new Date().toISOString(),
        conversationId: data.conversationId,
      })

      console.log(`📥 User ${socket.userName} joined conversation ${data.conversationId}`)
    } catch (error) {
      console.error('Error joining conversation:', error)
      socket.emit(WSMessageType.ERROR, {
        type: WSMessageType.ERROR,
        timestamp: new Date().toISOString(),
        error: 'Failed to join conversation',
        code: 'JOIN_FAILED',
      })
    }
  }

  private async handleLeaveConversation(
    socket: AuthenticatedSocket,
    data: WSLeaveConversationMessage,
  ): Promise<void> {
    await socket.leave(data.conversationId)

    socket.emit(WSMessageType.LEFT_CONVERSATION, {
      type: WSMessageType.LEFT_CONVERSATION,
      timestamp: new Date().toISOString(),
      conversationId: data.conversationId,
    })

    console.log(`📤 User ${socket.userName} left conversation ${data.conversationId}`)
  }

  private async handleSendMessage(
    socket: AuthenticatedSocket,
    data: WSSendMessageMessage,
  ): Promise<void> {
    try {
      // Vérifier que l'utilisateur est membre de la conversation
      const member = await prisma.conversationMember.findUnique({
        where: {
          conversationId_userId: {
            conversationId: data.conversationId,
            userId: socket.userId!,
          },
        },
      })

      if (!member) {
        socket.emit(WSMessageType.MESSAGE_ERROR, {
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
          conversationId: data.conversationId,
          senderId: socket.userId!,
          content: data.content,
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
      socket.emit(WSMessageType.MESSAGE_SENT, {
        type: WSMessageType.MESSAGE_SENT,
        timestamp: new Date().toISOString(),
        messageId: newMessage.id,
      })

      // Broadcast le message à tous les membres de la conversation (y compris le sender)
      this.io.to(data.conversationId).emit(WSMessageType.NEW_MESSAGE, {
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
          attachments: data.attachments,
        },
      })

      console.log(`💬 Message sent by ${socket.userName} in conversation ${data.conversationId}`)
    } catch (error) {
      console.error('Error sending message:', error)
      socket.emit(WSMessageType.MESSAGE_ERROR, {
        type: WSMessageType.MESSAGE_ERROR,
        timestamp: new Date().toISOString(),
        error: 'Failed to send message',
      })
    }
  }

  private handleTypingStart(socket: AuthenticatedSocket, data: WSTypingMessage): void {
    // Broadcast aux autres membres de la conversation (exclure le sender)
    socket.to(data.conversationId).emit(WSMessageType.USER_TYPING, {
      type: WSMessageType.USER_TYPING,
      timestamp: new Date().toISOString(),
      conversationId: data.conversationId,
      userId: socket.userId!,
      userName: socket.userName!,
    })
  }

  private handleTypingStop(socket: AuthenticatedSocket, data: WSTypingMessage): void {
    // Broadcast aux autres membres de la conversation (exclure le sender)
    socket.to(data.conversationId).emit(WSMessageType.USER_STOPPED_TYPING, {
      type: WSMessageType.USER_STOPPED_TYPING,
      timestamp: new Date().toISOString(),
      conversationId: data.conversationId,
      userId: socket.userId!,
    })
  }

  public shutdown(): void {
    console.log('🛑 Shutting down Socket.IO server...')

    // Fermer toutes les connexions
    this.io.disconnectSockets()

    console.log('✅ Socket.IO server shut down')
  }
}
