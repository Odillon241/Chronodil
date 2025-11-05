"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { MessageSquare, Users, FolderKanban, Search, X } from "lucide-react";
import { toast } from "sonner";
import { createOrGetConversation } from "@/actions/chat.actions";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  image?: string | null;
  role: string;
}

interface Project {
  id: string;
  name: string;
  code: string;
  color: string;
}

interface ChatNewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[];
  projects: Project[];
  currentUserId: string;
  onConversationCreated: (conversationId: string) => void;
}

export function ChatNewConversationDialog({
  open,
  onOpenChange,
  users,
  projects,
  currentUserId,
  onConversationCreated,
}: ChatNewConversationDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);

  // Filtrer les utilisateurs (exclure l'utilisateur courant)
  const availableUsers = users.filter((u) => u.id !== currentUserId);

  const filteredUsers = availableUsers.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateDirectMessage = async (userId: string) => {
    setCreating(true);
    try {
      const result = await createOrGetConversation({
        type: "DIRECT",
        memberIds: [userId],
      });

      if (result?.data?.conversation) {
        toast.success("Conversation ouverte");
        onConversationCreated(result.data.conversation.id);
        onOpenChange(false);
        setSearchQuery("");
      } else {
        toast.error(result?.serverError || "Erreur lors de la création");
      }
    } catch (error) {
      toast.error("Erreur lors de la création de la conversation");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateGroup = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Veuillez sélectionner au moins un membre");
      return;
    }

    if (!groupName.trim()) {
      toast.error("Veuillez entrer un nom de groupe");
      return;
    }

    setCreating(true);
    try {
      const result = await createOrGetConversation({
        type: "GROUP",
        name: groupName.trim(),
        memberIds: selectedUsers,
      });

      if (result?.data?.conversation) {
        toast.success("Groupe créé avec succès");
        onConversationCreated(result.data.conversation.id);
        onOpenChange(false);
        setSearchQuery("");
        setSelectedUsers([]);
        setGroupName("");
      } else {
        toast.error(result?.serverError || "Erreur lors de la création");
      }
    } catch (error) {
      toast.error("Erreur lors de la création du groupe");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateProjectChat = async (projectId: string, projectName: string) => {
    setCreating(true);
    try {
      const result = await createOrGetConversation({
        type: "PROJECT",
        name: projectName,
        projectId,
        memberIds: [], // Les membres seront ajoutés automatiquement via les ProjectMembers
      });

      if (result?.data?.conversation) {
        toast.success("Chat de projet créé");
        onConversationCreated(result.data.conversation.id);
        onOpenChange(false);
        setSearchQuery("");
      } else {
        toast.error(result?.serverError || "Erreur lors de la création");
      }
    } catch (error) {
      toast.error("Erreur lors de la création du chat de projet");
    } finally {
      setCreating(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const removeSelectedUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((id) => id !== userId));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Nouvelle conversation</DialogTitle>
          <DialogDescription>
            Démarrez une conversation directe, créez un groupe ou un chat de projet
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="direct" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="direct">
              <MessageSquare className="h-4 w-4 mr-2" />
              Direct
            </TabsTrigger>
            <TabsTrigger value="group">
              <Users className="h-4 w-4 mr-2" />
              Groupe
            </TabsTrigger>
            <TabsTrigger value="project">
              <FolderKanban className="h-4 w-4 mr-2" />
              Projet
            </TabsTrigger>
          </TabsList>

          {/* Messages Directs */}
          <TabsContent value="direct" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un utilisateur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[300px] border rounded-lg bg-background">
              <div className="divide-y">
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Aucun utilisateur trouvé</p>
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleCreateDirectMessage(user.id)}
                      disabled={creating}
                      className="w-full p-3 hover:bg-accent transition-colors text-left flex items-center gap-3 disabled:opacity-50"
                    >
                      <Avatar>
                        <AvatarImage src={user.avatar || user.image || undefined} />
                        <AvatarFallback>
                          {user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                      <Badge variant="outline">{user.role}</Badge>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Groupes */}
          <TabsContent value="group" className="space-y-4">
            <div>
              <Label htmlFor="groupName">Nom du groupe</Label>
              <Input
                id="groupName"
                placeholder="Ex: Équipe Marketing"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((userId) => {
                  const user = availableUsers.find((u) => u.id === userId);
                  if (!user) return null;
                  return (
                    <Badge key={userId} variant="secondary" className="gap-1">
                      {user.name}
                      <button
                        onClick={() => removeSelectedUser(userId)}
                        className="ml-1 hover:bg-muted rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher des membres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[200px] border rounded-lg bg-background">
              <div className="divide-y">
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Aucun utilisateur trouvé</p>
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 p-3 hover:bg-accent cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => toggleUserSelection(user.id)}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar || user.image || undefined} />
                        <AvatarFallback>
                          {user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button
                onClick={handleCreateGroup}
                disabled={creating || selectedUsers.length === 0 || !groupName.trim()}
                className="bg-primary hover:bg-primary"
              >
                Créer le groupe
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* Projets */}
          <TabsContent value="project" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un projet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[300px] border rounded-lg bg-background">
              <div className="divide-y">
                {filteredProjects.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <FolderKanban className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Aucun projet trouvé</p>
                  </div>
                ) : (
                  filteredProjects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleCreateProjectChat(project.id, project.name)}
                      disabled={creating}
                      className="w-full p-3 hover:bg-accent transition-colors text-left flex items-center gap-3 disabled:opacity-50"
                    >
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      >
                        <FolderKanban className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{project.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Code: {project.code}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

