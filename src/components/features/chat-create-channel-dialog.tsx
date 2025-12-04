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
import { Hash, Lock } from "lucide-react";
import { toast } from "sonner";
import { createChannel } from "@/actions/chat.actions";

interface ChatCreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChannelCreated?: (channelId: string) => void;
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
}: ChatCreateChannelDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Général",
    purpose: "",
    isPrivate: false,
  });

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
        memberIds: [], // Pas de membres additionnels à la création
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
    onOpenChange(false);
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
