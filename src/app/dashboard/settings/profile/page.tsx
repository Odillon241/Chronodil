"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations/user";
import { getMyProfile, updateMyProfile } from "@/actions/user.actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Building2,
  UserCog,
  Clock,
  CalendarDays,
  Shield,
  Edit,
  Save,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  role: string;
  avatar: string | null;
  department: {
    id: string;
    name: string;
    code: string;
  } | null;
  manager: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  createdAt: Date;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const result = await getMyProfile({});
      if (result?.data) {
        setUser(result.data as any);
        reset({
          name: result.data.name || "",
          email: result.data.email,
          avatar: result.data.avatar || "",
        });
      }
    } catch (error) {
      toast.error("Erreur lors du chargement du profil");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: UpdateProfileInput) => {
    setIsSaving(true);
    try {
      const result = await updateMyProfile(data);

      if (result?.data) {
        toast.success("Profil mis à jour avec succès !");
        setUser(result.data as any);
        setIsEditing(false);
        loadProfile();
      } else {
        toast.error(result?.serverError || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      toast.error("Une erreur s'est produite");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    reset({
      name: user?.name || "",
      email: user?.email || "",
      avatar: user?.avatar || "",
    });
    setIsEditing(false);
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      ADMIN: "bg-red-100 text-red-800 border-red-200",
      HR: "bg-purple-100 text-purple-800 border-purple-200",
      MANAGER: "bg-blue-100 text-blue-800 border-blue-200",
      EMPLOYEE: "bg-green-100 text-green-800 border-green-200",
    };
    return colors[role as keyof typeof colors] || colors.EMPLOYEE;
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      ADMIN: "Administrateur",
      HR: "Ressources Humaines",
      MANAGER: "Manager",
      EMPLOYEE: "Employé",
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-rusty-red" />
          <p className="text-muted-foreground">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Impossible de charger le profil</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mon Profil</h1>
        <p className="text-muted-foreground">
          Gérez vos informations personnelles et vos préférences
        </p>
      </div>

      {/* Carte principale */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Colonne gauche - Avatar et infos rapides */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Photo de profil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={user.avatar || undefined} alt={user.name || "User"} />
                <AvatarFallback className="bg-rusty-red text-white text-2xl">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center space-y-1">
                <h3 className="font-semibold text-lg">{user.name || "Utilisateur"}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Rôle</span>
                <Badge className={getRoleBadgeColor(user.role)}>
                  {getRoleLabel(user.role)}
                </Badge>
              </div>

              {user.department && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Département</span>
                  <span className="text-sm font-medium">{user.department.name}</span>
                </div>
              )}

              {user.manager && (
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Manager</span>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-ou-crimson text-white text-xs">
                        {getInitials(user.manager.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user.manager.name}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Membre depuis</span>
                <span className="text-sm font-medium">
                  {new Date(user.createdAt).toLocaleDateString("fr-FR", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Colonne droite - Informations détaillées */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>
                  {isEditing
                    ? "Modifiez vos informations personnelles"
                    : "Consultez vos informations personnelles"}
                </CardDescription>
              </div>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              // Mode édition
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        className="pl-10"
                        placeholder="Jean Dupont"
                        {...register("name")}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        className="pl-10"
                        placeholder="jean.dupont@example.com"
                        {...register("email")}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Un email de confirmation sera envoyé si vous modifiez votre adresse
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avatar">URL photo de profil</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="avatar"
                        className="pl-10"
                        placeholder="https://example.com/photo.jpg"
                        {...register("avatar")}
                      />
                    </div>
                    {errors.avatar && (
                      <p className="text-sm text-destructive">{errors.avatar.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="bg-rusty-red hover:bg-ou-crimson"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Enregistrer
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Annuler
                  </Button>
                </div>
              </form>
            ) : (
              // Mode consultation
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <User className="h-4 w-4" />
                      Nom complet
                    </div>
                    <p className="text-sm font-medium pl-6">{user.name || "Non renseigné"}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      Email
                    </div>
                    <p className="text-sm font-medium pl-6">{user.email}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      Rôle
                    </div>
                    <p className="text-sm font-medium pl-6">{getRoleLabel(user.role)}</p>
                  </div>

                  {user.department && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        Département
                      </div>
                      <p className="text-sm font-medium pl-6">
                        {user.department.name} ({user.department.code})
                      </p>
                    </div>
                  )}

                  {user.manager && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <UserCog className="h-4 w-4" />
                        Manager assigné
                      </div>
                      <div className="pl-6">
                        <p className="text-sm font-medium">{user.manager.name}</p>
                        <p className="text-xs text-muted-foreground">{user.manager.email}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      Membre depuis
                    </div>
                    <p className="text-sm font-medium pl-6">
                      {new Date(user.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Informations additionnelles (futures) */}
                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Informations contractuelles</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                        <Clock className="h-4 w-4" />
                        Horaires hebdomadaires
                      </div>
                      <p className="text-sm font-medium pl-6 text-muted-foreground">
                        35h/semaine (à configurer)
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                        <CalendarDays className="h-4 w-4" />
                        Solde congés
                      </div>
                      <p className="text-sm font-medium pl-6 text-muted-foreground">
                        À venir (Phase 2)
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    Ces informations seront disponibles dans une prochaine mise à jour
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
