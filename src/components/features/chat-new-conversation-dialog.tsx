'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import {
  MessageSquare,
  Users,
  FolderKanban,
  Hash,
  X,
  Search,
  Lock,
  Sparkles,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'
import { createOrGetConversation, createChannel } from '@/actions/chat.actions'
import { motion, AnimatePresence } from 'motion/react'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'

interface User {
  id: string
  name: string
  email: string
  avatar?: string | null
  image?: string | null
  role: string
}

interface Project {
  id: string
  name: string
  code: string
  color: string
}

interface ChatNewConversationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  users: User[]
  projects: Project[]
  currentUserId: string
  onConversationCreated: (conversationId: string) => void
}

export function ChatNewConversationDialog({
  open,
  onOpenChange,
  users,
  projects,
  currentUserId,
  onConversationCreated,
}: ChatNewConversationDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [groupName, setGroupName] = useState('')
  const [channelName, setChannelName] = useState('')
  const [channelDescription, setChannelDescription] = useState('')
  const [channelCategory, setChannelCategory] = useState('')
  const [isPrivateChannel, setIsPrivateChannel] = useState(false)
  const [creating, setCreating] = useState(false)
  const [activeTab, setActiveTab] = useState('direct')

  // Filtrer les utilisateurs (exclure l'utilisateur courant)
  const availableUsers = users.filter((u) => u.id !== currentUserId)

  const filteredUsers = availableUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.code.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const resetForm = () => {
    setSearchQuery('')
    setSelectedUsers([])
    setGroupName('')
    setChannelName('')
    setChannelDescription('')
    setChannelCategory('')
    setIsPrivateChannel(false)
  }

  const handleClose = () => {
    onOpenChange(false)
    // Timeout pour laisser l'animation de fermeture se terminer avant de reset
    setTimeout(resetForm, 300)
  }

  const handleCreateDirectMessage = async (userId: string) => {
    setCreating(true)
    try {
      const result = await createOrGetConversation({
        type: 'DIRECT',
        memberIds: [userId],
      })

      if (result?.data?.conversation) {
        toast.success('Conversation ouverte')
        onConversationCreated(result.data.conversation.id)
        handleClose()
      } else {
        toast.error(result?.serverError || 'Erreur lors de la création')
      }
    } catch (_error) {
      toast.error('Erreur lors de la création de la conversation')
    } finally {
      setCreating(false)
    }
  }

  const handleCreateGroup = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Veuillez sélectionner au moins un membre')
      return
    }

    if (!groupName.trim()) {
      toast.error('Veuillez entrer un nom de groupe')
      return
    }

    setCreating(true)
    try {
      const result = await createOrGetConversation({
        type: 'GROUP',
        name: groupName.trim(),
        memberIds: selectedUsers,
      })

      if (result?.data?.conversation) {
        toast.success('Groupe créé avec succès')
        onConversationCreated(result.data.conversation.id)
        handleClose()
      } else {
        toast.error(result?.serverError || 'Erreur lors de la création')
      }
    } catch (_error) {
      toast.error('Erreur lors de la création du groupe')
    } finally {
      setCreating(false)
    }
  }

  const handleCreateProjectChat = async (projectId: string, projectName: string) => {
    setCreating(true)
    try {
      const result = await createOrGetConversation({
        type: 'PROJECT',
        name: projectName,
        projectId,
        memberIds: [], // Les membres seront ajoutés automatiquement via les ProjectMembers
      })

      if (result?.data?.conversation) {
        toast.success('Chat de projet créé')
        onConversationCreated(result.data.conversation.id)
        handleClose()
      } else {
        toast.error(result?.serverError || 'Erreur lors de la création')
      }
    } catch (_error) {
      toast.error('Erreur lors de la création du chat de projet')
    } finally {
      setCreating(false)
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }

  const removeSelectedUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((id) => id !== userId))
  }

  const tabTriggerClass = cn(
    'relative z-10 flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all group outline-none select-none',
    'data-[state=active]:text-primary data-[state=inactive]:text-muted-foreground hover:text-primary/80',
  )

  const tabIndicator = (
    <motion.div
      layoutId="activeTab"
      className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full"
      initial={false}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    />
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden border-none shadow-2xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl rounded-2xl flex flex-col">
        {/* Header avec Gradient */}
        <div className="relative p-6 pb-2 border-b shrink-0">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight mb-1">
              Nouvelle conversation
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground/80">
              Démarrez une discussion avec votre équipe.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6">
            <TabsList className="w-full bg-transparent p-0 border-b border-border/40 justify-start h-auto rounded-none space-x-0 relative">
              <TabsTrigger value="direct" className={tabTriggerClass}>
                <MessageSquare className="h-4 w-4" /> Direct
                {activeTab === 'direct' && tabIndicator}
              </TabsTrigger>
              <TabsTrigger value="group" className={tabTriggerClass}>
                <Users className="h-4 w-4" /> Groupe
                {activeTab === 'group' && tabIndicator}
              </TabsTrigger>
              <TabsTrigger value="channel" className={tabTriggerClass}>
                <Hash className="h-4 w-4" /> Canal
                {activeTab === 'channel' && tabIndicator}
              </TabsTrigger>
              <TabsTrigger value="project" className={tabTriggerClass}>
                <FolderKanban className="h-4 w-4" /> Projet
                {activeTab === 'project' && tabIndicator}
              </TabsTrigger>
            </TabsList>

            {/* Contenu des onglets - Wrap dans un conteneur flexible */}
            <div className="p-0 flex-1 overflow-hidden flex flex-col relative h-[500px]">
              {/* Messages Directs */}
              <TabsContent
                value="direct"
                className="h-full flex flex-col m-0 data-[state=active]:flex data-[state=inactive]:hidden"
              >
                <div className="p-4 px-6 border-b bg-muted/20">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un collègue..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-background/80 border-muted-foreground/20 h-10 transition-all focus-visible:ring-primary/20"
                      autoFocus={activeTab === 'direct'}
                    />
                  </div>
                </div>

                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-1">
                    {filteredUsers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                        <Users className="h-12 w-12 mb-3 opacity-10" />
                        <p className="text-sm font-medium opacity-60">Aucun utilisateur trouvé</p>
                      </div>
                    ) : (
                      filteredUsers.map((user) => (
                        <motion.button
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={user.id}
                          onClick={() => handleCreateDirectMessage(user.id)}
                          disabled={creating}
                          className="w-full p-3 rounded-xl hover:bg-muted/60 transition-all text-left flex items-center gap-3 group border border-transparent hover:border-border/40"
                        >
                          <UserAvatar
                            name={user.name}
                            avatar={user.image || user.avatar}
                            size="md"
                            className="ring-2 ring-transparent group-hover:ring-primary/10 transition-all"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate opacity-80">
                              {user.email}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-transparent border-border/60 text-muted-foreground group-hover:bg-background group-hover:text-foreground transition-colors"
                          >
                            {user.role}
                          </Badge>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                            <Send className="h-4 w-4" />
                          </div>
                        </motion.button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Groupes */}
              <TabsContent
                value="group"
                className="h-full flex flex-col m-0 data-[state=active]:flex data-[state=inactive]:hidden"
              >
                <div className="p-6 pb-2 space-y-4 shrink-0">
                  <div className="space-y-2">
                    <Label
                      htmlFor="groupName"
                      className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1"
                    >
                      Nom du groupe
                    </Label>
                    <Input
                      id="groupName"
                      placeholder="Ex: Équipe Marketing"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="bg-muted/30 border-muted-foreground/20 h-10 font-medium"
                      autoFocus={activeTab === 'group'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                      Membres ({selectedUsers.length})
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Ajouter des membres..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 bg-background border-muted-foreground/20 text-sm"
                      />
                    </div>
                  </div>

                  {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1 max-h-[80px] overflow-y-auto custom-scrollbar">
                      <AnimatePresence>
                        {selectedUsers.map((userId) => {
                          const user = availableUsers.find((u) => u.id === userId)
                          if (!user) return null
                          return (
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              key={userId}
                            >
                              <Badge
                                variant="secondary"
                                className="gap-1.5 pl-1 pr-2 py-1 h-7 bg-primary/10 text-primary hover:bg-primary/15 border-transparent"
                              >
                                <UserAvatar
                                  name={user.name}
                                  avatar={user.image || user.avatar}
                                  size="xs"
                                  className="h-5 w-5"
                                />
                                {user.name}
                                <button
                                  onClick={() => removeSelectedUser(userId)}
                                  className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            </motion.div>
                          )
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-hidden px-6 pb-2 min-h-0">
                  <div className="h-full border rounded-xl overflow-hidden bg-muted/10">
                    <ScrollArea className="h-full">
                      <div className="p-2 space-y-1">
                        {filteredUsers.length === 0 ? (
                          <div className="p-8 text-center text-muted-foreground">
                            <p className="text-sm opactiy-60">Aucun utilisateur trouvé</p>
                          </div>
                        ) : (
                          filteredUsers.map((user) => (
                            <div
                              key={user.id}
                              onClick={() => toggleUserSelection(user.id)}
                              className={cn(
                                'flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all border border-transparent',
                                selectedUsers.includes(user.id)
                                  ? 'bg-primary/5 border-primary/10'
                                  : 'hover:bg-muted/60 hover:border-border/30',
                              )}
                            >
                              <Checkbox
                                checked={selectedUsers.includes(user.id)}
                                onCheckedChange={() => toggleUserSelection(user.id)}
                                className="border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <UserAvatar
                                name={user.name}
                                avatar={user.image || user.avatar}
                                size="sm"
                              />
                              <div className="flex-1 min-w-0">
                                <p
                                  className={cn(
                                    'text-sm font-medium truncate transition-colors',
                                    selectedUsers.includes(user.id) && 'text-primary',
                                  )}
                                >
                                  {user.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate opacity-70">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>

                <div className="p-4 border-t bg-muted/20 flex justify-end">
                  <Button
                    onClick={handleCreateGroup}
                    disabled={creating || selectedUsers.length === 0 || !groupName.trim()}
                    className={cn(
                      'relative overflow-hidden transition-all',
                      !creating && 'hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5',
                    )}
                  >
                    {creating ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" /> Création...
                      </>
                    ) : (
                      <>
                        Créer le groupe <Users className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              {/* Projets */}
              <TabsContent
                value="project"
                className="h-full flex flex-col m-0 data-[state=active]:flex data-[state=inactive]:hidden"
              >
                <div className="p-4 px-6 border-b bg-muted/20">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un projet..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 bg-background/80"
                      autoFocus={activeTab === 'project'}
                    />
                  </div>
                </div>

                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-2">
                    {filteredProjects.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                        <FolderKanban className="h-12 w-12 mb-3 opacity-10" />
                        <p className="text-sm font-medium opacity-60">Aucun projet trouvé</p>
                      </div>
                    ) : (
                      filteredProjects.map((project) => (
                        <motion.button
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={project.id}
                          onClick={() => handleCreateProjectChat(project.id, project.name)}
                          disabled={creating}
                          className="w-full p-4 rounded-xl hover:bg-muted/60 transition-all text-left flex items-center gap-4 group border border-transparent hover:border-border/40 hover:shadow-sm"
                        >
                          <div
                            className="h-12 w-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                            style={{ backgroundColor: project.color }}
                          >
                            <FolderKanban className="h-6 w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                              {project.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                              <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wide uppercase border">
                                Code: {project.code}
                              </span>
                            </p>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                            <MessageSquare className="h-5 w-5" />
                          </div>
                        </motion.button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Canaux */}
              <TabsContent
                value="channel"
                className="h-full flex flex-col m-0 overflow-y-auto data-[state=active]:flex data-[state=inactive]:hidden"
              >
                <div className="p-6 space-y-6">
                  {/* Wrapper pour les infos du canal - même style que le dialog createChannel */}
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label
                          htmlFor="channelName"
                          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1"
                        >
                          Nom du canal <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                            #
                          </span>
                          <Input
                            id="channelName"
                            placeholder="général"
                            value={channelName}
                            onChange={(e) =>
                              setChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))
                            }
                            className="pl-7 bg-muted/30"
                            required
                            autoFocus={activeTab === 'channel'}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="channelCategory"
                          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1"
                        >
                          Catégorie
                        </Label>
                        <Input
                          id="channelCategory"
                          placeholder="Ex: Équipes"
                          value={channelCategory}
                          onChange={(e) => setChannelCategory(e.target.value)}
                          className="bg-muted/30"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="channelDescription"
                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1"
                      >
                        Description
                      </Label>
                      <Textarea
                        id="channelDescription"
                        placeholder="À propos de ce canal..."
                        value={channelDescription}
                        onChange={(e) => setChannelDescription(e.target.value)}
                        className="resize-none h-20 bg-muted/30"
                      />
                    </div>

                    <div
                      className={cn(
                        'flex items-start space-x-3 rounded-xl border p-4 transition-all duration-200 cursor-pointer',
                        isPrivateChannel
                          ? 'bg-orange-50/50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800'
                          : 'bg-muted/30 border-transparent hover:bg-muted/50',
                      )}
                      onClick={() => setIsPrivateChannel(!isPrivateChannel)}
                    >
                      <div className="mt-0.5">
                        <Checkbox
                          id="isPrivate"
                          checked={isPrivateChannel}
                          onCheckedChange={(checked) => setIsPrivateChannel(checked === true)}
                          className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                        />
                      </div>
                      <div className="space-y-1 flex-1">
                        <Label
                          htmlFor="isPrivate"
                          className="flex items-center gap-2 cursor-pointer font-semibold"
                        >
                          {isPrivateChannel ? (
                            <span className="text-orange-600 dark:text-orange-400 flex items-center gap-2">
                              <Lock className="h-4 w-4" /> Canal Privé
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Hash className="h-4 w-4 text-muted-foreground" /> Canal Public
                            </span>
                          )}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {isPrivateChannel
                            ? 'Visible uniquement par invitation.'
                            : "Visible par toute l'organisation."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Invitation Membres */}
                  <div className="space-y-3 pt-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                      Membres initiaux
                    </Label>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher des membres..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 bg-background border-muted-foreground/20 text-sm"
                      />
                    </div>

                    {selectedUsers.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedUsers.map((userId) => {
                          const user = availableUsers.find((u) => u.id === userId)
                          if (!user) return null
                          return (
                            <Badge
                              key={userId}
                              variant="secondary"
                              className="gap-1 bg-primary/10 text-primary hover:bg-primary/20"
                            >
                              {user.name}
                              <button
                                onClick={() => removeSelectedUser(userId)}
                                className="ml-1 hover:bg-background/50 rounded-full"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          )
                        })}
                      </div>
                    )}

                    <div className="h-[150px] border rounded-lg overflow-hidden bg-muted/10">
                      <ScrollArea className="h-full">
                        <div className="p-2 space-y-1">
                          {filteredUsers.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground text-xs">
                              Aucun résultat
                            </div>
                          ) : (
                            filteredUsers.map((user) => (
                              <div
                                key={user.id}
                                onClick={() => toggleUserSelection(user.id)}
                                className={cn(
                                  'flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors',
                                  selectedUsers.includes(user.id)
                                    ? 'bg-primary/5 border border-primary/10'
                                    : 'hover:bg-muted/60 border border-transparent',
                                )}
                              >
                                <Checkbox
                                  checked={selectedUsers.includes(user.id)}
                                  onCheckedChange={() => toggleUserSelection(user.id)}
                                  className="h-4 w-4"
                                />
                                <UserAvatar
                                  name={user.name}
                                  avatar={user.image || user.avatar}
                                  size="xs"
                                  className="h-6 w-6"
                                />
                                <span className="text-sm truncate flex-1 opacity-90">
                                  {user.name}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={async () => {
                        if (!channelName.trim()) {
                          toast.error('Le nom du canal est requis')
                          return
                        }

                        setCreating(true)
                        try {
                          const result = await createChannel({
                            name: channelName.trim(),
                            description: channelDescription.trim() || undefined,
                            category: channelCategory.trim() || undefined,
                            isPrivate: isPrivateChannel,
                            memberIds: selectedUsers,
                          })

                          if (result?.data?.conversation) {
                            toast.success('Canal créé avec succès')
                            onConversationCreated(result.data.conversation.id)
                            handleClose()
                          } else {
                            toast.error(result?.serverError || 'Erreur lors de la création')
                          }
                        } catch (_error) {
                          toast.error('Erreur lors de la création du canal')
                        } finally {
                          setCreating(false)
                        }
                      }}
                      disabled={creating || !channelName.trim()}
                      className={cn(
                        'relative overflow-hidden transition-all bg-primary hover:bg-primary/90',
                        !creating && 'hover:shadow-md hover:-translate-y-0.5',
                      )}
                    >
                      {creating ? (
                        <>
                          <Spinner className="mr-2 h-4 w-4" /> Création...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" /> Créer le canal
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
