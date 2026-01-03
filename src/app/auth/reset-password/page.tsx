"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updatePassword, createClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthLayout, AuthLogo } from "@/components/auth";
import { useResetPasswordToken } from "@/hooks/use-reset-password-token";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

// ============================================================================
// Constantes
// ============================================================================

const QUOTES = [
  '"Créez un nouveau mot de passe sécurisé."',
  '"Votre sécurité est notre priorité."',
  '"Choisissez un mot de passe fort."',
];

// ============================================================================
// Schéma de validation
// ============================================================================

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ============================================================================
// Composants d'état
// ============================================================================

function LoadingState() {
  return (
    <AuthLayout showBackground={false}>
      <Card className="w-full max-w-md relative z-10">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Vérification du lien...</p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

function InvalidTokenState() {
  return (
    <AuthLayout showBackground={false}>
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="space-y-1">
          <div className="mb-4">
            <AuthLogo />
          </div>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-center">Lien invalide ou expiré</CardTitle>
          <CardDescription className="text-center font-heading mt-4">
            Ce lien de réinitialisation n'est plus valide. Il a peut-être expiré
            ou a déjà été utilisé.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col space-y-4">
          <Link href="/auth/forgot-password" className="w-full">
            <Button type="button" className="w-full">
              Demander un nouveau lien
            </Button>
          </Link>
          <Link href="/auth/login" className="w-full">
            <Button type="button" variant="outline" className="w-full">
              Retour à la connexion
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}

function SuccessState() {
  return (
    <AuthLayout showBackground={false}>
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="space-y-1">
          <div className="mb-4">
            <AuthLogo />
          </div>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-center">
            Mot de passe réinitialisé !
          </CardTitle>
          <CardDescription className="text-center font-heading mt-4">
            Votre mot de passe a été réinitialisé avec succès.
            <br />
            <br />
            Vous allez être redirigé vers la page de connexion...
          </CardDescription>
        </CardHeader>
      </Card>
    </AuthLayout>
  );
}

// ============================================================================
// Formulaire de réinitialisation
// ============================================================================

interface ResetPasswordFormProps {
  onSuccess: () => void;
}

function ResetPasswordForm({ onSuccess }: ResetPasswordFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);

    try {
      const { error } = await updatePassword(data.password);

      if (error) {
        toast.error(error.message || "Erreur lors de la réinitialisation");
        return;
      }

      onSuccess();
      toast.success("Mot de passe réinitialisé avec succès!");

      // Déconnecter l'utilisateur et rediriger vers la page de login
      const supabase = createClient();
      await supabase.auth.signOut();

      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout quotes={QUOTES}>
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="space-y-1">
          <div className="mb-4">
            <AuthLogo />
          </div>
          <CardTitle className="text-center">Nouveau mot de passe</CardTitle>
          <CardDescription className="text-center font-heading">
            Choisissez un nouveau mot de passe sécurisé
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Réinitialisation...
                </>
              ) : (
                "Réinitialiser le mot de passe"
              )}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              <Link
                href="/auth/login"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Retour à la connexion
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  );
}

// ============================================================================
// Composant principal
// ============================================================================

function ResetPasswordContent() {
  const { status, isValidating, isValid } = useResetPasswordToken();
  const [resetSuccess, setResetSuccess] = useState(false);

  // État de validation (spinner)
  if (isValidating) {
    return <LoadingState />;
  }

  // Token invalide ou expiré
  if (!isValid) {
    return <InvalidTokenState />;
  }

  // Succès - Mot de passe réinitialisé
  if (resetSuccess) {
    return <SuccessState />;
  }

  // Formulaire de réinitialisation
  return <ResetPasswordForm onSuccess={() => setResetSuccess(true)} />;
}

// ============================================================================
// Page exportée avec Suspense
// ============================================================================

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
