"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, UserPlus, Trash2, Crown } from "lucide-react";
import { toast } from "sonner";
import { addMembersToConversation, removeMemberFromConversation } from "@/actions/chat.actions";
import { getAllUsersForChat } from "@/actions/user.actions";

interface ChatManageMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  members: any[];
  currentUserId: string;
  onUpdate: () => void;
}

export function ChatManageMembersDialog({
  open,
  onOpenChange,
  conversationId,
  members,
  currentUserId,
  onUpdate,
}: ChatManageMembersDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const filteredMembers = members.filter((member) =>
    member.User.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const loadAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const result = await getAllUsersForChat({});
      if (result?.data) {
        // Filtrer les utilisateurs qui sont déjà membres
        const memberIds = members.map((m) => m.User.id);
        const nonMembers = result.data.filter((u: any) => !memberIds.includes(u.id));
        setAllUsers(nonMembers);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    try {
      const result = await addMembersToConversation({
        conversationId,
        memberIds: [userId],
      });

      if (result?.serverError) {
        toast.error(result.serverError);
      } else {
        toast.success("Membre ajouté avec succès");
        onUpdate();
        // Retirer l'utilisateur de la liste locale des non-membres
        setAllUsers(allUsers.filter((u) => u.id !== userId));
      }
    } catch (error) {
      toast.error("Erreur lors de l'ajout du membre");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Voulez-vous vraiment retirer ce membre ?")) return;

    try {
      const result = await removeMemberFromConversation({
        conversationId,
        userId,
      });

      if (result?.serverError) {
        toast.error(result.serverError);
      } else {
        toast.success("Membre retiré avec succès");
        onUpdate();
      }
    } catch (error) {
      toast.error("Erreur lors du retrait du membre");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gérer les membres</DialogTitle>
          <DialogDescription>
            Ajoutez ou retirez des membres de cette conversation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {showAddMember ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddMember(false)}
                >
                  Retour
                </Button>
                <Input
                  placeholder="Rechercher un utilisateur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
              </div>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {allUsers
                    .filter((user) =>
                      user.name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2 hover:bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.avatar || user.image} />
                            <AvatarFallback>
                              {user.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAddMember(user.id)}
                        >
                          Ajouter
                        </Button>
                      </div>
                    ))}
                  {allUsers.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      Aucun utilisateur à ajouter
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un membre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    setShowAddMember(true);
                    loadAllUsers();
                  }}
                  title="Ajouter un membre"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {filteredMembers.map((member) => (
                    <div
                      key={member.User.id}
                      className="flex items-center justify-between p-2 hover:bg-muted rounded-lg group"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.User.avatar || member.User.image} />
                          <AvatarFallback>
                            {member.User.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-1">
                            <p className="text-sm font-medium">{member.User.name}</p>
                            {member.isAdmin && (
                              <Crown className="h-3 w-3 text-yellow-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {member.isAdmin ? "Administrateur" : "Membre"}
                          </p>
                        </div>
                      </div>
                      {member.User.id !== currentUserId && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveMember(member.User.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
