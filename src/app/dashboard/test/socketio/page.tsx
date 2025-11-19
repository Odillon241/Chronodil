'use client';

import { useState, useEffect } from 'react';
import { useSocketIOChat } from '@/hooks/use-socketio-chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { WSConnectionState } from '@/types/websocket';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

interface TypingUser {
  userId: string;
  userName: string;
}

export default function SocketIOTestPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [testConversationId] = useState('test-conversation-123');
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const {
    connectionState,
    isConnected,
    isAuthenticated,
    joinedConversations,
    connect,
    disconnect,
    joinConversation,
    leaveConversation,
    sendChatMessage,
    startTyping,
    stopTyping,
  } = useSocketIOChat({
    onNewMessage: (message) => {
      console.log('📨 New message received:', message);
      setMessages((prev) => [...prev, message as Message]);
    },
    onUserTyping: (data) => {
      console.log('⌨️ User typing:', data);
      setTypingUsers((prev) => {
        const exists = prev.find((u) => u.userId === data.userId);
        if (exists) return prev;
        return [...prev, { userId: data.userId, userName: data.userName }];
      });
    },
    onUserStoppedTyping: (data) => {
      console.log('⌨️ User stopped typing:', data);
      setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    },
    autoConnect: false, // Connexion manuelle pour les tests
  });

  const getConnectionBadge = () => {
    switch (connectionState) {
      case WSConnectionState.CONNECTING:
        return <Badge variant="outline" className="bg-yellow-100">🔄 Connexion...</Badge>;
      case WSConnectionState.CONNECTED:
        return <Badge variant="outline" className="bg-green-100">✅ Connecté</Badge>;
      case WSConnectionState.AUTHENTICATED:
        return <Badge variant="outline" className="bg-green-200">🔐 Authentifié</Badge>;
      case WSConnectionState.DISCONNECTED:
        return <Badge variant="outline" className="bg-gray-100">⚫ Déconnecté</Badge>;
      case WSConnectionState.ERROR:
        return <Badge variant="outline" className="bg-red-100">❌ Erreur</Badge>;
      default:
        return <Badge variant="outline">❓ Inconnu</Badge>;
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !isAuthenticated) return;

    sendChatMessage(testConversationId, messageInput);
    setMessageInput('');
    stopTyping(testConversationId);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    // Démarrer le typing indicator
    if (e.target.value && isAuthenticated) {
      startTyping(testConversationId);

      // Arrêter le typing indicator après 3 secondes d'inactivité
      if (typingTimeout) clearTimeout(typingTimeout);
      const timeout = setTimeout(() => {
        stopTyping(testConversationId);
      }, 3000);
      setTypingTimeout(timeout);
    } else {
      stopTyping(testConversationId);
    }
  };

  const handleJoinConversation = () => {
    joinConversation(testConversationId);
  };

  const handleLeaveConversation = () => {
    leaveConversation(testConversationId);
  };

  const isInConversation = joinedConversations.includes(testConversationId);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🧪 Test Socket.IO Chat</h1>
        <p className="text-muted-foreground">
          Testez le système de chat en temps réel avec Socket.IO
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de contrôle */}
        <div className="lg:col-span-1 space-y-4">
          {/* État de connexion */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">État de connexion</CardTitle>
              <CardDescription>Statut actuel du Socket.IO</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">État:</span>
                {getConnectionBadge()}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Authentifié:</span>
                <Badge variant={isAuthenticated ? 'default' : 'secondary'}>
                  {isAuthenticated ? '✅ Oui' : '❌ Non'}
                </Badge>
              </div>
              <Separator />
              <div className="space-y-2">
                {!isConnected ? (
                  <Button onClick={connect} className="w-full" size="sm">
                    🔌 Se connecter
                  </Button>
                ) : (
                  <Button onClick={disconnect} variant="destructive" className="w-full" size="sm">
                    🔌 Se déconnecter
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Gestion de conversation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conversation de test</CardTitle>
              <CardDescription>ID: {testConversationId}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Dans la room:</span>
                <Badge variant={isInConversation ? 'default' : 'secondary'}>
                  {isInConversation ? '✅ Oui' : '❌ Non'}
                </Badge>
              </div>
              <Separator />
              <div className="space-y-2">
                {!isInConversation ? (
                  <Button
                    onClick={handleJoinConversation}
                    disabled={!isAuthenticated}
                    className="w-full"
                    size="sm"
                  >
                    📥 Rejoindre la conversation
                  </Button>
                ) : (
                  <Button
                    onClick={handleLeaveConversation}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    📤 Quitter la conversation
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ℹ️ Instructions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>1. Cliquez sur "Se connecter"</p>
              <p>2. Rejoignez la conversation de test</p>
              <p>3. Envoyez des messages</p>
              <p>4. Ouvrez cette page dans un autre onglet pour voir les messages en temps réel</p>
            </CardContent>
          </Card>
        </div>

        {/* Zone de chat */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle>💬 Messages</CardTitle>
              <CardDescription>
                {messages.length} message{messages.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4">
              {/* Liste des messages */}
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                      <p className="text-lg mb-2">📭 Aucun message</p>
                      <p className="text-sm">
                        Envoyez votre premier message pour commencer !
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className="bg-muted p-3 rounded-lg space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">
                            {message.senderName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Indicateur de typing */}
              {typingUsers.length > 0 && (
                <div className="text-sm text-muted-foreground italic">
                  {typingUsers.map((u) => u.userName).join(', ')} est en train
                  d&apos;écrire...
                </div>
              )}

              {/* Input de message */}
              <div className="flex gap-2">
                <Input
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={
                    !isAuthenticated
                      ? 'Connectez-vous d\'abord...'
                      : !isInConversation
                      ? 'Rejoignez la conversation d\'abord...'
                      : 'Tapez votre message...'
                  }
                  disabled={!isAuthenticated || !isInConversation}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || !isAuthenticated || !isInConversation}
                >
                  Envoyer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
