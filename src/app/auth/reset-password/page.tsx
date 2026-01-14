"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updatePassword, signOut, createClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

function LoadingState() {
  return (
    <AuthLayout title="Vérification..." description="Veuillez patienter">
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Validation de votre lien de sécurité...</p>
      </div>
    </AuthLayout>
  );
}

function InvalidTokenState() {
  return (
    <AuthLayout title="Lien invalide" description="Impossible de procéder">
      <div className="flex flex-col items-center space-y-6 text-center">
        <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>

        <Alert variant="destructive">
          <AlertTitle>Lien expiré ou incorrect</AlertTitle>
          <AlertDescription className="mt-2">
            Ce lien de réinitialisation n'est plus valide. Il a peut-être expiré ou a déjà été utilisé.
          </AlertDescription>
        </Alert>

        <div className="w-full space-y-3">
          <Link href="/auth/forgot-password" className="w-full block">
            <Button className="w-full">
              Demander un nouveau lien
            </Button>
          </Link>
          <Link href="/auth/login" className="w-full block">
            <Button variant="ghost" className="w-full">
              Retour à la connexion
            </Button>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

function SuccessState() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push("/auth/login");
    }, 3000);
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <AuthLayout title="Mot de passe modifié" description="Vous allez être redirigé...">
      <div className="flex flex-col items-center space-y-6 text-center">
        <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-500" />
        </div>

        <p className="text-muted-foreground">
          Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec vos nouveaux identifiants.
        </p>

        <Link href="/auth/login" className="w-full">
          <Button className="w-full" size="lg">
            Se connecter maintenant
          </Button>
        </Link>
      </div>
    </AuthLayout>
  );
}

function ResetPasswordForm({ onSuccess }: { onSuccess: () => void }) {
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
        let errorMessage = error.message;

        if (errorMessage.includes("same as the old password")) {
          errorMessage = "Le nouveau mot de passe doit être différent de l'ancien";
        } else if (errorMessage.includes("session")) {
          errorMessage = "Session expirée. Veuillez demander un nouveau lien.";
        }

        toast.error(errorMessage);
        return;
      }

      await signOut();
      toast.success("Mot de passe réinitialisé avec succès !");
      onSuccess();
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Nouveau mot de passe"
      description="Choisissez un mot de passe sécurisé"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nouveau mot de passe</Label>
          <Input
            id="password"
            type="password"
            placeholder="Minimum 8 caractères"
            {...register("password")}
            disabled={isLoading}
            autoComplete="new-password"
            className="bg-transparent"
          />
          {errors.password && (
            <p className="text-sm text-destructive font-medium">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Répétez le mot de passe"
            {...register("confirmPassword")}
            disabled={isLoading}
            autoComplete="new-password"
            className="bg-transparent"
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive font-medium">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full mt-2" disabled={isLoading} size="lg">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Confirmation...
            </span>
          ) : (
            "Réinitialiser le mot de passe"
          )}
        </Button>

        <div className="pt-2 text-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la connexion
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

function ResetPasswordContent() {
  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "success">("loading");
  const searchParams = useSearchParams();

  useEffect(() => {
    const verifySession = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          setStatus("invalid");
          return;
        }

        setStatus("valid");
      } catch (error) {
        console.error("[Reset] Session verification error:", error);
        setStatus("invalid");
      }
    };

    const timeout = setTimeout(verifySession, 500);
    return () => clearTimeout(timeout);
  }, [searchParams]);

  if (status === "loading") {
    return <LoadingState />;
  }

  if (status === "invalid") {
    return <InvalidTokenState />;
  }

  if (status === "success") {
    return <SuccessState />;
  }

  return <ResetPasswordForm onSuccess={() => setStatus("success")} />;
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-muted/40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
