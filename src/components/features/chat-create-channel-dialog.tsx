"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Hash, Lock, Users, X, Search } from "lucide-react";
import { toast } from "sonner";
import { createChannel } from "@/actions/chat.actions";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  image?: string | null;
  role?: string;
}

interface ChatCreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChannelCreated?: (channelId: string) => void;
  users?: User[];
  currentUserId?: string;
}

const CATEGORIES = [
  { value: "Général", label: "📢 Général" },
  { value: "Projets", label: "📁 Projets" },
  { value: "Équipes", label: "👥 Équipes" },
  { value: "Autres", label: "🔧 Autres" },
];

export function ChatCreateChannelDialog({
  open,
  onOpenChange,
  onChannelCreated,
  users = [],
  currentUserId,
}: ChatCreateChannelDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Général",
    purpose: "",
    isPrivate: false,
  });

  // Filtrer les utilisateurs disponibles (exclure l'utilisateur courant)
  const availableUsers = users.filter((u) => u.id !== currentUserId);

  // Filtrer les utilisateurs selon la recherche
  const filteredUsers = availableUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  // Obtenir les utilisateurs sélectionnés
  const selectedMembers = availableUsers.filter((u) =>
    selectedMemberIds.includes(u.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Le nom du canal est requis");
      return;
    }

    // Validation du nom (pas d'espaces, caractères spéciaux limités)
    const nameRegex = /^[a-z0-9-_]+$/;
    if (!nameRegex.test(formData.name)) {
      toast.error(
        "Le nom du canal ne peut contenir que des lettres minuscules, chiffres, tirets et underscores"
      );
      return;
    }

    setLoading(true);

    try {
      const result = await createChannel({
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category,
        purpose: formData.purpose || undefined,
        isPrivate: formData.isPrivate,
        memberIds: selectedMemberIds, // Membres sélectionnés
      });

      if (result?.data?.conversation) {
        toast.success(
          `Canal #${formData.name} créé avec succès ${
            formData.isPrivate ? "🔒" : "📢"
          }`
        );
        onChannelCreated?.(result.data.conversation.id);
        handleClose();
      } else {
        throw new Error(result?.serverError || "Erreur lors de la création");
      }
    } catch (error: any) {
      console.error("Erreur création canal:", error);
      toast.error(error.message || "Erreur lors de la création du canal");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      category: "Général",
      purpose: "",
      isPrivate: false,
    });
    setSelectedMemberIds([]);
    setMemberSearchQuery("");
    onOpenChange(false);
  };

  const toggleMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {formData.isPrivate ? (
              <Lock className="h-5 w-5 text-orange-500" />
            ) : (
              <Hash className="h-5 w-5 text-blue-500" />
            )}
            Créer un nouveau canal
          </DialogTitle>
          <DialogDescription>
            Les canaux permettent d'organiser les conversations par thème ou
            équipe.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom du canal */}
          <div className="space-y-2">
            <Label htmlFor="channel-name">
              Nom du canal <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                #
              </span>
              <Input
                id="channel-name"
                placeholder="nom-du-canal"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    name: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                  }))
                }
                className="pl-7"
                maxLength={100}
                required
                disabled={loading}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Minuscules, chiffres, tirets et underscores uniquement
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="channel-description">Description</Label>
            <Textarea
              id="channel-description"
              placeholder="De quoi traite ce canal..."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              maxLength={500}
              rows={3}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/500 caractères
            </p>
          </div>

          {/* Catégorie */}
          <div className="space-y-2">
            <Label htmlFor="channel-category">Catégorie</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value }))
              }
              disabled={loading}
            >
              <SelectTrigger id="channel-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Objectif (purpose) */}
          <div className="space-y-2">
            <Label htmlFor="channel-purpose">Objectif du canal</Label>
            <Input
              id="channel-purpose"
              placeholder="Ex: Discuter des nouvelles fonctionnalités"
              value={formData.purpose}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, purpose: e.target.value }))
              }
              maxLength={500}
              disabled={loading}
            />
          </div>

          {/* Ajout de membres */}
          <div className="space-y-3">
            <Label>Ajouter des membres</Label>
            
            {/* Membres sélectionnés */}
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/50">
                {selectedMembers.map((member) => (
                  <Badge
                    key={member.id}
                    variant="secondary"
                    className="flex items-center gap-1.5 pr-1"
                  >
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={member.avatar || member.image || undefined} />
                      <AvatarFallback className="text-[8px]">
                        {member.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{member.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleMember(member.id)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      disabled={loading}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Recherche et sélection de membres */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des membres..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="pl-9"
                  disabled={loading}
                />
              </div>
              
              {filteredUsers.length > 0 && (
                <ScrollArea className="h-[200px] border rounded-md">
                  <div className="p-2 space-y-1">
                    {filteredUsers.map((user) => {
                      const isSelected = selectedMemberIds.includes(user.id);
                      return (
                        <div
                          key={user.id}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted transition-colors",
                            isSelected && "bg-muted"
                          )}
                          onClick={() => toggleMember(user.id)}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleMember(user.id)}
                            disabled={loading}
                          />
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar || user.image || undefined} />
                            <AvatarFallback>
                              {user.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
              
              {filteredUsers.length === 0 && memberSearchQuery && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucun membre trouvé</p>
                </div>
              )}
              
              {availableUsers.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucun membre disponible</p>
                </div>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground">
              {selectedMembers.length > 0
                ? `${selectedMembers.length} membre${selectedMembers.length > 1 ? "s" : ""} sélectionné${selectedMembers.length > 1 ? "s" : ""}`
                : "Sélectionnez les membres à ajouter au canal (optionnel)"}
            </p>
          </div>

          {/* Type de canal */}
          <div className="flex items-start space-x-3 rounded-md border p-4">
            <Checkbox
              id="channel-private"
              checked={formData.isPrivate}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  isPrivate: checked === true,
                }))
              }
              disabled={loading}
            />
            <div className="space-y-1 leading-none">
              <Label
                htmlFor="channel-private"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Lock className="h-4 w-4 text-orange-500" />
                Canal privé
              </Label>
              <p className="text-xs text-muted-foreground">
                Seules les personnes invitées peuvent voir et rejoindre ce
                canal
              </p>
            </div>
          </div>

          {/* Actions */}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Création...
                </>
              ) : (
                <>Créer le canal</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
