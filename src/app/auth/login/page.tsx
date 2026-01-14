"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Checkbox } from "@/components/ui/checkbox";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Afficher les erreurs de callback si présentes
    const error = searchParams.get("error");
    if (error) {
      toast.error(decodeURIComponent(error));
    }

    // Message de succès si confirmation email réussie
    const message = searchParams.get("message");
    if (message) {
      toast.success(decodeURIComponent(message));
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const result = await signIn({
        email: data.email,
        password: data.password,
      });

      if (result.error) {
        // Messages d'erreur personnalisés en français
        let errorMessage = result.error.message || "Échec de la connexion";

        if (errorMessage.includes("Invalid login credentials")) {
          errorMessage = "Email ou mot de passe incorrect";
        } else if (errorMessage.includes("Email not confirmed")) {
          errorMessage = "Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte de réception.";
        } else if (errorMessage.includes("Too many requests")) {
          errorMessage = "Trop de tentatives. Veuillez réessayer dans quelques minutes.";
        }

        toast.error(errorMessage);
      } else {
        toast.success("Connexion réussie !");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Une erreur s'est produite lors de la connexion");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Bienvenue"
      description="Connectez-vous pour accéder à votre espace"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="nom@exemple.com"
            {...register("email")}
            disabled={isLoading}
            autoComplete="email"
            className="bg-transparent"
          />
          {errors.email && (
            <p className="text-sm text-destructive font-medium">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Mot de passe</Label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            {...register("password")}
            disabled={isLoading}
            autoComplete="current-password"
            className="bg-transparent"
          />
          {errors.password && (
            <p className="text-sm text-destructive font-medium">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
          size="lg"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Spinner className="h-4 w-4" />
              Connexion...
            </span>
          ) : "Se connecter"}
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Ou
            </span>
          </div>
        </div>

        <div className="text-center text-sm">
          Vous n'avez pas de compte ?{" "}
          <Link href="/auth/register" className="text-primary hover:text-primary/80 font-medium transition-colors hover:underline">
            S'inscrire
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
