"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema, type UpdateProfileInput, changePasswordSchema, type ChangePasswordInput } from "@/lib/validations/user";
import { getMyProfile, updateMyProfile, updateMyEmail, changeMyPassword } from "@/actions/user.actions";
import { uploadAvatar } from "@/actions/upload.actions";
import { createClient } from "@/lib/supabase-client";
import { ImageCropper } from "@/components/features/image-cropper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User,
  Mail,
  Building2,
  UserCog,
  CalendarDays,
  Shield,
  Save,
  Camera,
  Smile,
  ImageIcon,
  Briefcase,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ArrowLeft,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserAvatar, getInitials } from "@/components/ui/user-avatar";
import { cn } from "@/lib/utils";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  role: string;
  avatar: string | null;
  position: string | null;
  department: { id: string; name: string; code: string } | null;
  manager: { id: string; name: string | null; email: string } | null;
  createdAt: Date;
}

const ROLES: Record<string, { label: string; color: string }> = {
  ADMIN: { label: "Administrateur", color: "bg-red-100 text-red-800" },
  HR: { label: "Ressources Humaines", color: "bg-purple-100 text-purple-800" },
  DIRECTEUR: { label: "Directeur", color: "bg-amber-100 text-amber-800" },
  MANAGER: { label: "Manager", color: "bg-blue-100 text-blue-800" },
  EMPLOYEE: { label: "Employé", color: "bg-emerald-100 text-emerald-800" },
};

const POPULAR_EMOJIS = [
  "😀", "😃", "😄", "😁", "😊", "😎", "🤓", "🥳", "😇", "🤩",
  "😍", "🥰", "😘", "🤗", "🤔", "😏", "🙂", "🙃", "😌", "😴",
  "🦊", "🐱", "🐶", "🦁", "🐯", "🐻", "🐼", "🐨", "🦄", "🌟",
];

type AvatarStep = "select" | "crop";
type AvatarMode = "photo" | "emoji";

export default function ProfilePage() {
  // User state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [originalEmail, setOriginalEmail] = useState("");

  // Avatar dialog state
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [avatarStep, setAvatarStep] = useState<AvatarStep>("select");
  const [avatarMode, setAvatarMode] = useState<AvatarMode>("photo");
  const [selectedEmoji, setSelectedEmoji] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [croppedImageUrl, setCroppedImageUrl] = useState("");
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password dialog state
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: "", email: "", avatar: "", position: "" }
  });

  const { register: registerPassword, handleSubmit: handleSubmitPassword, reset: resetPassword, formState: { errors: passwordErrors, isDirty: isPasswordDirty } } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const result = await getMyProfile({});
      if (result?.data) {
        const userData = result.data as any;
        setUser(userData);
        setOriginalEmail(userData.email);
        reset({ name: userData.name || "", email: userData.email, avatar: userData.avatar || "", position: userData.position || "" });
      }
    } catch { toast.error("Erreur lors du chargement du profil"); }
    finally { setIsLoading(false); }
  };

  const onSubmit = async (data: UpdateProfileInput) => {
    setIsSaving(true);
    try {
      const emailChanged = data.email && data.email !== originalEmail;
      if (emailChanged) {
        const emailResult = await updateMyEmail({ newEmail: data.email! });
        if (!emailResult?.data?.success) {
          toast.error(emailResult?.serverError || "Erreur"); setIsSaving(false); return;
        }
        setOriginalEmail(data.email!);
      }
      const result = await updateMyProfile({ name: data.name, email: emailChanged ? data.email : originalEmail, avatar: data.avatar, position: data.position });
      if (result?.data) {
        toast.success("Profil mis à jour !"); setUser(result.data as any); loadProfile();
      } else { toast.error(result?.serverError || "Erreur"); }
    } catch { toast.error("Erreur"); }
    finally { setIsSaving(false); }
  };


  const resetAvatarDialog = useCallback(() => {
    setAvatarStep("select");
    setAvatarMode("photo");
    setSelectedEmoji("");
    setSelectedFile(null);
    setCroppedImageUrl("");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [previewUrl]);

  const handleAvatarDialogClose = (open: boolean) => {
    if (!open) resetAvatarDialog();
    setIsAvatarDialogOpen(open);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5MB");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setAvatarStep("crop");
  };

  const handleCropComplete = (croppedUrl: string) => {
    setCroppedImageUrl(croppedUrl);
    setAvatarStep("select");
    toast.success("Image recadrée avec succès");
  };

  const handleCropCancel = () => {
    setAvatarStep("select");
    setSelectedFile(null);
    setCroppedImageUrl("");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAvatarSave = async () => {
    setIsUpdatingAvatar(true);
    try {
      let avatarUrl: string;

      if (avatarMode === "photo") {
        if (!croppedImageUrl && !selectedFile) {
          toast.error("Veuillez sélectionner une image");
          return;
        }
        const base64 = croppedImageUrl || await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(selectedFile!);
        });
        const uploadResult = await uploadAvatar({
          fileName: selectedFile?.name || "avatar.png",
          fileContent: base64,
          fileType: selectedFile?.type || "image/png",
        });
        if (!uploadResult?.data?.fileUrl) {
          toast.error("Erreur lors de l'upload");
          return;
        }
        avatarUrl = uploadResult.data.fileUrl;
      } else {
        if (!selectedEmoji) {
          toast.error("Veuillez sélectionner un emoji");
          return;
        }
        avatarUrl = selectedEmoji;
      }

      const result = await updateMyProfile({
        name: user?.name || "",
        email: user?.email || "",
        avatar: avatarUrl,
        position: user?.position || "",
      });

      if (result?.data) {
        toast.success("Avatar mis à jour !");
        setUser(result.data as any);
        handleAvatarDialogClose(false);

        // Forcer le refresh de la session Supabase pour obtenir les nouvelles métadonnées
        try {
          const supabase = createClient();
          await supabase.auth.refreshSession();
        } catch (e) {
          console.error("Erreur refresh session:", e);
        }

        setTimeout(() => window.location.reload(), 500);
      } else {
        toast.error(result?.serverError || "Erreur lors de la mise à jour");
      }
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const handlePasswordChange = async (data: ChangePasswordInput) => {
    setIsChangingPassword(true);
    try {
      const result = await changeMyPassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      if (result?.data?.success) { toast.success("Mot de passe modifié !"); setIsPasswordDialogOpen(false); resetPassword(); }
      else toast.error(result?.serverError || "Erreur");
    } catch { toast.error("Erreur"); }
    finally { setIsChangingPassword(false); }
  };

  if (isLoading) return <div className="flex items-center justify-center h-[calc(100vh-200px)]"><Spinner className="size-6" /></div>;
  if (!user) return <div className="text-center py-12 text-muted-foreground">Impossible de charger le profil</div>;

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mon Profil</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">Gérez vos informations personnelles</p>
      </div>

      {/* Profile Card with Avatar */}
      <Card className="overflow-hidden">
        <div className="relative h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5" />
        <CardContent className="relative pt-0 pb-6">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-end -mt-12">
            {/* Avatar */}
            <div className="relative group">
              <UserAvatar
                name={user.name}
                avatar={user.avatar}
                size="3xl"
                className="ring-4 ring-background shadow-lg"
              />
              <Button
                onClick={() => setIsAvatarDialogOpen(true)}
                size="icon"
                className="absolute -bottom-1 -right-1 h-10 w-10 rounded-full shadow-xl bg-slate-900 hover:bg-slate-800 text-white border-2 border-background"
              >
                <Camera className="h-5 w-5" />
              </Button>
            </div>
            {/* Info */}
            <div className="flex-1 text-center sm:text-left space-y-1">
              <h2 className="text-xl font-bold">{user.name || "Utilisateur"}</h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{user.email}</span>
                <Badge className={cn("text-xs", ROLES[user.role]?.color)}>{ROLES[user.role]?.label || user.role}</Badge>
              </div>
              {user.position && <p className="text-sm text-muted-foreground flex items-center gap-1 justify-center sm:justify-start"><Briefcase className="h-3.5 w-3.5" />{user.position}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-flex">
          <TabsTrigger value="info" className="gap-2"><User className="h-4 w-4" />Informations</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><Shield className="h-4 w-4" />Sécurité</TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium flex items-center gap-2"><User className="h-3.5 w-3.5" />Nom complet <span className="text-destructive">*</span></Label>
                    <Input placeholder="Jean Dupont" {...register("name")} />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium flex items-center gap-2"><Mail className="h-3.5 w-3.5" />Email <span className="text-destructive">*</span></Label>
                    <Input type="email" placeholder="jean@example.com" {...register("email")} />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium flex items-center gap-2"><Briefcase className="h-3.5 w-3.5" />Poste</Label>
                    <Input placeholder="Développeur, Chef de projet..." {...register("position")} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium flex items-center gap-2"><Building2 className="h-3.5 w-3.5" />Département</Label>
                    <Input value={user.department?.name || "Non assigné"} disabled className="bg-muted/50" />
                  </div>
                </div>

                {/* Read-only info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Shield className="h-3 w-3" />Rôle</span>
                    <Badge className={cn("text-xs", ROLES[user.role]?.color)}>{ROLES[user.role]?.label}</Badge>
                  </div>
                  {user.manager && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><UserCog className="h-3 w-3" />Manager</span>
                      <p className="text-sm font-medium">{user.manager.name}</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><CalendarDays className="h-3 w-3" />Membre depuis</span>
                    <p className="text-sm font-medium">{new Date(user.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button type="submit" disabled={isSaving || !isDirty} className="min-w-[140px]">
                    {isSaving ? <Spinner className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                    Enregistrer
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><KeyRound className="h-5 w-5" />Mot de passe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">Changer votre mot de passe</p>
                  <p className="text-sm text-muted-foreground">Nous recommandons d'utiliser un mot de passe unique et sécurisé</p>
                </div>
                <Button variant="outline" onClick={() => setIsPasswordDialogOpen(true)}>
                  <Lock className="h-4 w-4 mr-2" />Modifier
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Avatar Dialog */}
      <Dialog open={isAvatarDialogOpen} onOpenChange={handleAvatarDialogClose}>
        <DialogContent className={cn(
          "p-0 gap-0 overflow-hidden",
          avatarStep === "crop" ? "max-w-lg" : "max-w-md"
        )}>
          {/* Header */}
          <DialogHeader className="p-4 sm:p-6 pb-4 border-b bg-muted/30">
            <div className="flex items-center gap-3">
              {avatarStep === "crop" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handleCropCancel}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="flex-1">
                <DialogTitle className="text-base sm:text-lg">
                  {avatarStep === "crop" ? "Recadrer l'image" : "Modifier votre avatar"}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm mt-0.5">
                  {avatarStep === "crop"
                    ? "Ajustez le cadrage de votre photo"
                    : "Choisissez une photo ou un emoji"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="p-4 sm:p-6">
            {avatarStep === "crop" && previewUrl ? (
              <ImageCropper
                src={previewUrl}
                onCropComplete={handleCropComplete}
                onCancel={handleCropCancel}
                height="h-56 sm:h-72"
                compact
              />
            ) : (
              <div className="space-y-5">
                {/* Mode selector */}
                <div className="flex gap-2 p-1 bg-muted rounded-lg">
                  <button
                    type="button"
                    onClick={() => setAvatarMode("photo")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium transition-all",
                      avatarMode === "photo"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <ImageIcon className="h-4 w-4" />
                    <span>Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarMode("emoji")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium transition-all",
                      avatarMode === "emoji"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Smile className="h-4 w-4" />
                    <span>Emoji</span>
                  </button>
                </div>

                {/* Preview */}
                <div className="flex justify-center py-2">
                  <Avatar className="h-24 w-24 sm:h-28 sm:w-28 ring-4 ring-muted">
                    <AvatarImage
                      src={avatarMode === "photo" && croppedImageUrl ? croppedImageUrl : undefined}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground text-3xl sm:text-4xl">
                      {avatarMode === "emoji" && selectedEmoji
                        ? selectedEmoji
                        : getInitials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Photo upload */}
                {avatarMode === "photo" && (
                  <div className="space-y-3">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "relative flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                        "hover:border-primary/50 hover:bg-muted/50",
                        croppedImageUrl ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                      )}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="sr-only"
                      />
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Camera className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">
                          {croppedImageUrl ? "Changer l'image" : "Cliquez pour choisir"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          JPG, PNG ou WebP • Max 5MB
                        </p>
                      </div>
                    </div>
                    {croppedImageUrl && (
                      <p className="text-xs text-center text-emerald-600 font-medium">
                        ✓ Image prête à être sauvegardée
                      </p>
                    )}
                  </div>
                )}

                {/* Emoji selector */}
                {avatarMode === "emoji" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-6 sm:grid-cols-10 gap-1">
                      {POPULAR_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setSelectedEmoji(emoji)}
                          className={cn(
                            "h-10 w-10 sm:h-9 sm:w-9 flex items-center justify-center rounded-md text-xl sm:text-lg transition-all",
                            selectedEmoji === emoji
                              ? "bg-primary/20 ring-2 ring-primary scale-110"
                              : "hover:bg-muted hover:scale-105"
                          )}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <Input
                      placeholder="Ou tapez un emoji..."
                      value={selectedEmoji}
                      onChange={(e) => setSelectedEmoji(e.target.value)}
                      maxLength={2}
                      className="text-center text-xl h-12"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleAvatarDialogClose(false)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAvatarSave}
                    disabled={
                      isUpdatingAvatar ||
                      (avatarMode === "photo" && !croppedImageUrl) ||
                      (avatarMode === "emoji" && !selectedEmoji)
                    }
                    className="flex-1"
                  >
                    {isUpdatingAvatar ? (
                      <Spinner className="mr-2" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Sauvegarder
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              Changer le mot de passe
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitPassword(handlePasswordChange)} className="space-y-4 pt-4">
            {[
              { id: "currentPassword", label: "Mot de passe actuel", show: showCurrentPassword, setShow: setShowCurrentPassword, error: passwordErrors.currentPassword },
              { id: "newPassword", label: "Nouveau mot de passe", show: showNewPassword, setShow: setShowNewPassword, error: passwordErrors.newPassword },
              { id: "confirmPassword", label: "Confirmer", show: showConfirmPassword, setShow: setShowConfirmPassword, error: passwordErrors.confirmPassword },
            ].map((field) => (
              <div key={field.id} className="space-y-2">
                <Label className="text-xs font-medium">{field.label} <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input type={field.show ? "text" : "password"} placeholder="••••••••" {...registerPassword(field.id as any)} className="pr-10" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={() => field.setShow(!field.show)}>
                    {field.show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {field.error && <p className="text-xs text-destructive">{field.error.message}</p>}
              </div>
            ))}
            <div className="flex gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)} className="flex-1">Annuler</Button>
              <Button type="submit" disabled={isChangingPassword || !isPasswordDirty} className="flex-1">
                {isChangingPassword ? <Spinner className="mr-2" /> : null}Modifier
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
