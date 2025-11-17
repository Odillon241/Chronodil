"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations/user";
import { getMyProfile, updateMyProfile } from "@/actions/user.actions";
import { uploadAvatar } from "@/actions/upload.actions";
import { ImageCropper } from "@/components/features/image-cropper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Camera,
  Smile,
  Upload,
  Briefcase,
} from "lucide-react";
import { SpinnerCustom } from "@/components/features/loading-spinner";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "@/lib/auth-client";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  role: string;
  avatar: string | null;
  position: string | null;
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
  const { data: session } = useSession();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [avatarType, setAvatarType] = useState<'upload' | 'emoji'>('upload');
  const [avatarValue, setAvatarValue] = useState('');
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [croppedImageUrl, setCroppedImageUrl] = useState<string>('');
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        const userData = result.data as any;
        setUser(userData);
        reset({
          name: userData.name || "",
          email: userData.email,
          avatar: userData.avatar || "",
          position: userData.position || "",
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
      position: user?.position || "",
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

  const openAvatarDialog = () => {
    setAvatarValue(user?.avatar || '');
    setAvatarType(user?.avatar && !user.avatar.startsWith('/uploads') && !user.avatar.startsWith('http') ? 'emoji' : 'upload');
    setSelectedFile(null);
    setPreviewUrl('');
    setCroppedImageUrl('');
    setShowCropper(false);
    // Réinitialiser l'input de fichier
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsAvatarDialogOpen(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Valider le type de fichier
      if (!file.type.startsWith('image/')) {
        toast.error("Veuillez sélectionner un fichier image");
        return;
      }
      
      // Valider la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Le fichier ne doit pas dépasser 5MB");
        return;
      }

      setSelectedFile(file);
      
      // Créer une URL de prévisualisation
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Afficher le recadreur
      setShowCropper(true);
    }
  };

  const handleCropComplete = (croppedUrl: string) => {
    setCroppedImageUrl(croppedUrl);
    setShowCropper(false);
    toast.success("Image recadrée avec succès !");
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAvatarUpdate = async () => {
    setIsUpdatingAvatar(true);
    try {
      let avatarUrl = avatarValue.trim();

      // Si c'est un upload de fichier
      if (avatarType === 'upload' && (selectedFile || croppedImageUrl)) {
        let base64: string;
        
        if (croppedImageUrl) {
          // Utiliser l'image recadrée
          base64 = croppedImageUrl;
        } else if (selectedFile) {
          // Convertir le fichier original en base64
          base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(selectedFile);
          });
        } else {
          toast.error("Aucun fichier sélectionné");
          return;
        }

        // Uploader le fichier
        const uploadResult = await uploadAvatar({
          fileName: selectedFile?.name || 'cropped-avatar.png',
          fileContent: base64,
          fileType: selectedFile?.type || 'image/png',
        });

        if (uploadResult?.data?.fileUrl) {
          avatarUrl = uploadResult.data.fileUrl;
        } else {
          toast.error("Erreur lors de l'upload du fichier");
          return;
        }
      } else if (avatarType === 'emoji' && avatarValue.trim()) {
        avatarUrl = avatarValue.trim();
      } else {
        toast.error("Veuillez sélectionner un fichier ou saisir un emoji");
        return;
      }

      // Mettre à jour le profil
      const result = await updateMyProfile({
        name: user?.name || '',
        email: user?.email || '',
        avatar: avatarUrl,
        position: user?.position || '',
      });

      if (result?.data) {
        toast.success("Avatar mis à jour avec succès !");
        setUser(result.data as any);
        setIsAvatarDialogOpen(false);
        
        // Nettoyer l'URL de prévisualisation
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl('');
        }
        
        // Réinitialiser l'input de fichier
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Réinitialiser l'image recadrée
        setCroppedImageUrl('');
        
        // Recharger la page pour mettre à jour la session
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(result?.serverError || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      toast.error("Une erreur s'est produite");
      console.error(error);
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const popularEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
    '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
    '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
    '😔', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢',
    '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱',
    '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤨', '😐'
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <SpinnerCustom />
          <p className="text-muted-foreground mt-4">Chargement du profil...</p>
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
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mon Profil</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Gérez vos informations personnelles et vos préférences
        </p>
      </div>

      {/* Carte principale */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {/* Colonne gauche - Avatar et infos rapides */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Photo de profil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage 
                    src={
                      user.avatar?.startsWith('/uploads') || user.avatar?.startsWith('http') 
                        ? user.avatar 
                        : undefined
                    } 
                    alt={user.name || "User"}
                  />
                  <AvatarFallback className="bg-primary text-white text-2xl">
                    {user.avatar && !user.avatar.startsWith('/uploads') && !user.avatar.startsWith('http') ? user.avatar : getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  onClick={openAvatarDialog}
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 bg-white shadow-md hover:bg-gray-50"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-semibold text-lg">{user.name || "Utilisateur"}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">Rôle</span>
                <Badge className={`${getRoleBadgeColor(user.role)} text-xs`}>
                  {getRoleLabel(user.role)}
                </Badge>
              </div>

              {user.department && (
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Département</span>
                  <span className="text-xs sm:text-sm font-medium">{user.department.name}</span>
                </div>
              )}

              {user.manager && (
                <div className="space-y-1">
                  <span className="text-xs sm:text-sm text-muted-foreground">Manager</span>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-primary text-white text-xs">
                        {getInitials(user.manager.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs sm:text-sm font-medium">{user.manager.name}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">Membre depuis</span>
                <span className="text-xs sm:text-sm font-medium">
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-lg sm:text-xl">Informations personnelles</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {isEditing
                    ? "Modifiez vos informations personnelles"
                    : "Consultez vos informations personnelles"}
                </CardDescription>
              </div>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
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
                    <Label htmlFor="position">Poste</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="position"
                        className="pl-10"
                        placeholder="Ex: Développeur Full-Stack, Chef de projet..."
                        {...register("position")}
                      />
                    </div>
                    {errors.position && (
                      <p className="text-sm text-destructive">{errors.position.message}</p>
                    )}
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

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="submit"
                    className="w-full sm:w-auto bg-primary hover:bg-primary text-xs sm:text-sm"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <SpinnerCustom />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Enregistrer
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    <X className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Annuler
                  </Button>
                </div>
              </form>
            ) : (
              // Mode consultation
              <div className="space-y-6">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
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

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      Poste
                    </div>
                    <p className="text-sm font-medium pl-6">{user.position || "Non renseigné"}</p>
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
                  <h3 className="font-semibold text-sm sm:text-base">Informations contractuelles</h3>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
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

      {/* Modal de sélection d'avatar */}
      <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier votre avatar</DialogTitle>
            <DialogDescription>
              Importez une photo depuis votre ordinateur ou sélectionnez un emoji
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Sélection du type d'avatar */}
            <div className="space-y-2">
              <Label>Type d'avatar</Label>
              <Select value={avatarType} onValueChange={(value: 'upload' | 'emoji') => setAvatarType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upload">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Importer une photo
                    </div>
                  </SelectItem>
                  <SelectItem value="emoji">
                    <div className="flex items-center gap-2">
                      <Smile className="h-4 w-4" />
                      Emoji
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Aperçu de l'avatar */}
            <div className="flex justify-center">
              <Avatar className="h-20 w-20">
                <AvatarImage 
                  src={
                    avatarType === 'upload' && croppedImageUrl
                      ? croppedImageUrl
                      : avatarType === 'upload' && previewUrl 
                        ? previewUrl 
                        : avatarType === 'upload' && avatarValue.startsWith('/uploads') 
                          ? avatarValue 
                          : undefined
                  } 
                  alt="Preview"
                />
                <AvatarFallback className="bg-primary text-white text-xl">
                  {avatarType === 'emoji' ? avatarValue : getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Champ de saisie */}
            {avatarType === 'upload' ? (
              <div className="space-y-2">
                {!showCropper && (
                  <>
                    <Label htmlFor="avatar-file">Sélectionner une image</Label>
                    <Input
                      ref={fileInputRef}
                      id="avatar-file"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                      Formats acceptés : JPG, PNG, GIF, WebP (max 5MB)
                    </p>
                    {selectedFile && !croppedImageUrl && (
                      <p className="text-sm text-green-600">
                        ✓ Fichier sélectionné : {selectedFile.name}
                      </p>
                    )}
                    {croppedImageUrl && (
                      <p className="text-sm text-blue-600">
                        ✓ Image recadrée prête à être sauvegardée
                      </p>
                    )}
                  </>
                )}
                
                {showCropper && previewUrl && (
                  <ImageCropper
                    src={previewUrl}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                  />
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="avatar-emoji">Emoji</Label>
                <Input
                  id="avatar-emoji"
                  placeholder="😊"
                  value={avatarValue}
                  onChange={(e) => setAvatarValue(e.target.value)}
                  maxLength={2}
                />
                
                {/* Sélection d'emojis populaires */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Emojis populaires</Label>
                  <div className="grid grid-cols-10 gap-1 max-h-32 overflow-y-auto">
                    {popularEmojis.map((emoji, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-lg hover:bg-muted"
                        onClick={() => setAvatarValue(emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                onClick={handleAvatarUpdate}
                className="w-full sm:flex-1 bg-primary hover:bg-primary text-xs sm:text-sm"
                disabled={isUpdatingAvatar || (avatarType === 'upload' && !selectedFile && !croppedImageUrl) || (avatarType === 'emoji' && !avatarValue.trim())}
              >
                {isUpdatingAvatar ? (
                  <>
                    <SpinnerCustom />
                    Mise à jour...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Sauvegarder
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAvatarDialogOpen(false)}
                disabled={isUpdatingAvatar}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                <X className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
