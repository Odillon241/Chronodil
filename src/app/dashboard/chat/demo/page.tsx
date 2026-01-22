'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TypingIndicator,
  TypingBubble,
  MessageSlideIn,
  UnreadPulse,
  ConversationSlide,
  ChatNotificationToast,
  ChatNotificationToastCompact,
  ChatHeaderEnhanced,
} from '@/features/chat/components'
import { Badge } from '@/components/ui/badge'
import { ChatEmptyState } from '@/features/chat/components/chat-empty-state'

/**
 * Page de démonstration des composants de chat
 * URL: /dashboard/chat/demo
 *
 * ⚠️ Cette page est à usage de développement uniquement
 * Supprimer en production ou protéger avec un rôle ADMIN
 */
export default function ChatDemoPage() {
  const [showToast, setShowToast] = useState(false)
  const [showCompactToast, setShowCompactToast] = useState(false)
  const [unreadCount, setUnreadCount] = useState(3)

  const mockUsers = [
    { id: '1', name: 'Alice Martin', avatar: null },
    { id: '2', name: 'Bob Dupont', avatar: null },
    { id: '3', name: 'Charlie Durand', avatar: null },
  ]

  const mockConversation = {
    id: 'conv-1',
    type: 'DIRECT' as const,
    name: 'Alice Martin',
    ConversationMember: [
      {
        User: {
          id: '1',
          name: 'Alice Martin',
          avatar: null,
          image: null,
          lastSeenAt: new Date(),
        },
        isAdmin: false,
      },
    ],
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Composants de Chat - Démo</h1>
        <p className="text-muted-foreground">
          Prévisualisation des nouveaux composants d'interface utilisateur
        </p>
      </div>

      <Tabs defaultValue="indicators" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="indicators">Indicateurs</TabsTrigger>
          <TabsTrigger value="animations">Animations</TabsTrigger>
          <TabsTrigger value="toasts">Notifications</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
        </TabsList>

        {/* Indicateurs de Saisie */}
        <TabsContent value="indicators" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Indicateur de Saisie - Complet</CardTitle>
              <CardDescription>
                Affiche les utilisateurs en train d'écrire avec leurs avatars
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4">
                <TypingIndicator users={[mockUsers[0]]} />
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <TypingIndicator users={[mockUsers[0], mockUsers[1]]} />
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <TypingIndicator users={mockUsers} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Indicateur de Saisie - Bulle</CardTitle>
              <CardDescription>Version minimaliste en forme de bulle</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-lg p-4">
                <TypingBubble />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>État Vide - Amélioré</CardTitle>
              <CardDescription>Interface d'accueil avec suggestions et animations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] bg-muted/30 rounded-lg">
                <ChatEmptyState onNewChat={() => alert('Nouvelle conversation')} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Animations */}
        <TabsContent value="animations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Animation de Message</CardTitle>
              <CardDescription>Messages avec effet de glissement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 bg-muted/30 rounded-lg p-4">
                {[0, 1, 2].map((i) => (
                  <MessageSlideIn key={i} index={i} isOwn={i % 2 === 0}>
                    <div
                      className={`p-3 rounded-2xl max-w-xs ${
                        i % 2 === 0
                          ? 'bg-primary text-primary-foreground ml-auto rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      }`}
                    >
                      Message de démonstration #{i + 1}
                    </div>
                  </MessageSlideIn>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Badge Pulsé Non Lu</CardTitle>
              <CardDescription>Badge avec animation pulse pour attirer l'attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <UnreadPulse>
                  <Badge variant="destructive">{unreadCount}</Badge>
                </UnreadPulse>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setUnreadCount((c) => c + 1)}>
                    +1
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setUnreadCount((c) => Math.max(0, c - 1))}
                  >
                    -1
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Animation de Conversation</CardTitle>
              <CardDescription>Liste de conversations avec effet de glissement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 bg-muted/30 rounded-lg p-4">
                {mockUsers.map((user, index) => (
                  <ConversationSlide key={user.id} index={index}>
                    <div className="p-3 rounded-lg bg-background border hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">Dernier message...</div>
                    </div>
                  </ConversationSlide>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Toast */}
        <TabsContent value="toasts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Toast de Notification - Complet</CardTitle>
              <CardDescription>
                Notification avec avatar, message et bouton de réponse
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => setShowToast(!showToast)}>
                {showToast ? 'Masquer' : 'Afficher'} le Toast
              </Button>
              {showToast && (
                <ChatNotificationToast
                  sender={mockUsers[0]}
                  message="Salut ! Tu as vu le dernier rapport ?"
                  conversationName="Projet Alpha"
                  onReply={() => alert('Répondre')}
                  onDismiss={() => setShowToast(false)}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Toast de Notification - Compact</CardTitle>
              <CardDescription>Version compacte pour les notifications groupées</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => setShowCompactToast(!showCompactToast)}>
                {showCompactToast ? 'Masquer' : 'Afficher'} le Toast Compact
              </Button>
              {showCompactToast && (
                <ChatNotificationToastCompact
                  count={5}
                  latestSender={mockUsers[1]}
                  onView={() => alert('Voir les messages')}
                  onDismiss={() => setShowCompactToast(false)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Headers */}
        <TabsContent value="headers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Header de Conversation Enrichi</CardTitle>
              <CardDescription>Header avec présence en ligne et actions rapides</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <ChatHeaderEnhanced
                  conversation={mockConversation}
                  currentUserId="2"
                  isOnline={true}
                  lastSeenAt={new Date()}
                  isMuted={false}
                  onBack={() => alert('Retour')}
                  onSearch={() => alert('Recherche')}
                  onVoiceCall={() => alert('Appel vocal')}
                  onVideoCall={() => alert('Appel vidéo')}
                  onToggleMute={() => alert('Toggle mute')}
                  onShowInfo={() => alert('Informations')}
                />
                <div className="p-8 bg-muted/30 text-center text-sm text-muted-foreground">
                  Zone de messages (démo)
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Header - Utilisateur Hors Ligne</CardTitle>
              <CardDescription>
                Affichage avec statut hors ligne et dernière connexion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <ChatHeaderEnhanced
                  conversation={mockConversation}
                  currentUserId="2"
                  isOnline={false}
                  lastSeenAt={new Date(Date.now() - 1000 * 60 * 15)} // 15 min ago
                  isMuted={true}
                  onShowInfo={() => alert('Informations')}
                />
                <div className="p-8 bg-muted/30 text-center text-sm text-muted-foreground">
                  Zone de messages (démo)
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Note de développement */}
      <Card className="mt-8 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="pt-6">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            ⚠️ <strong>Note</strong>: Cette page est destinée au développement et aux tests.
            Supprimer le dossier <code>/dashboard/chat/demo</code> en production ou protéger avec un
            rôle ADMIN.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
