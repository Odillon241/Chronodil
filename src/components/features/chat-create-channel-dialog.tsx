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
import { Hash, Lock, Users, X, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createChannel } from "@/actions/chat.actions";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

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
  { value: "Général", label: "📢 Général", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: "Projets", label: "📁 Projets", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  { value: "Équipes", label: "👥 Équipes", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  { value: "Autres", label: "🔧 Autres", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
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

  const availableUsers = users.filter((u) => u.id !== currentUserId);

  const filteredUsers = availableUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  const selectedMembers = availableUsers.filter((u) =>
    selectedMemberIds.includes(u.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Le nom du canal est requis");
      return;
    }

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
        memberIds: selectedMemberIds,
      });

      if (result?.data?.conversation) {
        toast.success(
          `Canal #${formData.name} créé avec succès ${formData.isPrivate ? "🔒" : "📢"
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
      <DialogContent className="sm:max-w-[600px] border-none shadow-2xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl p-0 overflow-hidden rounded-2xl">
        {/* Header avec Gradient */}
        <div className="relative p-6 pb-4 border-b">


          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <div className={cn(
                "p-2 rounded-xl flex items-center justify-center shadow-sm",
                formData.isPrivate
                  ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                  : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              )}>
                {formData.isPrivate ? <Lock className="h-6 w-6" /> : <Hash className="h-6 w-6" />}
              </div>
              Créer un canal
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Configurez un nouvel espace de discussion pour votre équipe.
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[70vh]">
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">

            {/* Nom et Description */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2.5">
                <Label htmlFor="channel-name" className="text-sm font-semibold flex items-center gap-1.5">
                  Nom du canal <span className="text-primary">*</span>
                </Label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium group-focus-within:text-primary transition-colors">
                    #
                  </span>
                  <Input
                    id="channel-name"
                    placeholder="nouveau-projet"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        name: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                      }))
                    }
                    className="pl-7 h-11 bg-muted/40 border-muted-foreground/20 focus-visible:ring-primary/20 focus-visible:border-primary transition-all font-medium"
                    maxLength={100}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="channel-category" className="text-sm font-semibold">Catégorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                  disabled={loading}
                >
                  <SelectTrigger id="channel-category" className="h-11 bg-muted/40 border-muted-foreground/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <span className={cn("px-2 py-0.5 rounded text-xs font-medium", cat.color)}>
                            {cat.label.split(" ")[0]}
                          </span>
                          <span>{cat.label.split(" ").slice(1).join(" ")}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2.5">
              <Label htmlFor="channel-description" className="text-sm font-semibold">Description</Label>
              <Textarea
                id="channel-description"
                placeholder="Décrivez brièvement le but de ce canal..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="bg-muted/40 border-muted-foreground/20 focus-visible:ring-primary/20 min-h-[80px] resize-none"
                maxLength={500}
                disabled={loading}
              />
            </div>

            {/* Type : Privé/Public */}
            <div
              className={cn(
                "flex items-start space-x-3 rounded-xl border p-4 transition-all duration-200 cursor-pointer",
                formData.isPrivate
                  ? "bg-orange-50/50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800"
                  : "bg-muted/30 border-transparent hover:bg-muted/50"
              )}
              onClick={() => setFormData(prev => ({ ...prev, isPrivate: !prev.isPrivate }))}
            >
              <div className="mt-0.5">
                <Checkbox
                  id="channel-private"
                  checked={formData.isPrivate}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isPrivate: checked === true }))
                  }
                  className={cn(
                    "data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500",
                    !formData.isPrivate && "border-muted-foreground/40"
                  )}
                  disabled={loading}
                />
              </div>
              <div className="space-y-1 flex-1">
                <Label
                  htmlFor="channel-private"
                  className="flex items-center gap-2 cursor-pointer font-semibold text-base"
                >
                  {formData.isPrivate ? (
                    <span className="text-orange-600 dark:text-orange-400 flex items-center gap-2">
                      <Lock className="h-4 w-4" /> Canal Privé
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" /> Canal Public
                    </span>
                  )}
                </Label>
                <p className="text-sm text-muted-foreground leading-snug">
                  {formData.isPrivate
                    ? "Seules les personnes invitées pourront voir et rejoindre ce canal. Idéal pour les sujets sensibles."
                    : "Tous les membres de l'espace de travail pourront voir et rejoindre ce canal."}
                </p>
              </div>
            </div>

            {/* Membres */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Inviter des membres
                </Label>
                <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                  {selectedMembers.length} sélectionné(s)
                </span>
              </div>

              <div className="space-y-3 p-4 rounded-xl border bg-card/50 shadow-sm">
                {/* Recherche */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom ou email..."
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    className="pl-9 h-9 bg-background border-muted-foreground/20 text-sm"
                    disabled={loading}
                  />
                </div>

                {/* Liste des utilisateurs */}
                <ScrollArea className="h-[180px] -mr-3 pr-3">
                  {filteredUsers.length > 0 ? (
                    <div className="space-y-1">
                      {filteredUsers.map((user) => {
                        const isSelected = selectedMemberIds.includes(user.id);
                        return (
                          <motion.div
                            key={user.id}
                            layoutId={user.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => toggleMember(user.id)}
                            className={cn(
                              "group flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border border-transparent",
                              isSelected
                                ? "bg-primary/5 border-primary/10"
                                : "hover:bg-muted hover:border-border"
                            )}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleMember(user.id)}
                              className="border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              disabled={loading}
                            />
                            <Avatar className="h-8 w-8 ring-1 ring-border shadow-sm">
                              <AvatarImage src={user.avatar || user.image || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                {user.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-sm font-medium truncate group-hover:text-primary transition-colors", isSelected && "text-primary")}>
                                {user.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate opacity-80">{user.email}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[120px] text-muted-foreground text-sm">
                      {memberSearchQuery ? (
                        <>
                          <Search className="h-8 w-8 mb-2 opacity-20" />
                          <p>Aucun résultat pour "{memberSearchQuery}"</p>
                        </>
                      ) : (
                        <>
                          <Users className="h-8 w-8 mb-2 opacity-20" />
                          <p>Aucun autre membre disponible</p>
                        </>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>

          </form>
        </ScrollArea>

        <DialogFooter className="p-6 pt-2 bg-background/50 backdrop-blur-sm">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="h-11 px-6 hover:bg-muted/80"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={loading}
            onClick={handleSubmit}
            className={cn(
              "h-11 px-8 relative overflow-hidden transition-all",
              !loading && "hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5"
            )}
          >
            {loading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Création du canal...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Créer le canal
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
