"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "next-themes";
import { resetPasswordSchema, resetPasswordConfirmSchema, type ResetPasswordInput, type ResetPasswordConfirmInput } from "@/lib/validations/auth";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import TypingText from "@/components/ui/shadcn-io/typing-text";
import { toast } from "sonner";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Éviter le mismatch d'hydratation
  useEffect(() => {
    setMounted(true);
  }, []);

  // Utiliser le logo clair par défaut pour éviter le mismatch d'hydratation
  const logoSrc = mounted && resolvedTheme === "dark" 
    ? "/assets/media/logo-dark.svg" 
    : "/assets/media/logo.svg";

  // Formulaire pour demander la réinitialisation
  const {
    register: registerRequest,
    handleSubmit: handleSubmitRequest,
    formState: { errors: errorsRequest },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Formulaire pour confirmer la réinitialisation avec token
  const {
    register: registerConfirm,
    handleSubmit: handleSubmitConfirm,
    formState: { errors: errorsConfirm },
  } = useForm<ResetPasswordConfirmInput>({
    resolver: zodResolver(resetPasswordConfirmSchema),
    defaultValues: {
      token: token || "",
    },
  });

  // Demander la réinitialisation (envoyer l'email)
  const onRequestReset = async (data: ResetPasswordInput) => {
    setIsLoading(true);
    try {
      // Utiliser l'API Better Auth pour envoyer l'email de réinitialisation
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Gérer les erreurs spécifiques
        if (response.status === 404) {
          toast.error(result.error?.message || "Aucun compte n'est associé à cet email.");
        } else {
          toast.error(result.error?.message || "Erreur lors de l'envoi de l'email");
        }
        return;
      }

      setEmailSent(true);
      toast.success("Un email de réinitialisation a été envoyé à votre adresse");
    } catch (error) {
      toast.error("Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  // Confirmer la réinitialisation avec le token
  const onConfirmReset = async (data: ResetPasswordConfirmInput) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: data.token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error?.message || "Erreur lors de la réinitialisation");
        return;
      }

      toast.success("Mot de passe réinitialisé avec succès ! Redirection...");
      setTimeout(() => {
        router.push("/auth/login");
      }, 1500);
    } catch (error) {
      toast.error("Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  // Si un token est présent dans l'URL, afficher le formulaire de confirmation
  if (token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 pb-24 relative overflow-hidden" style={{ backgroundColor: 'hsl(141, 78.9%, 90%)' }}>
        <Card className="w-full max-w-md relative z-10">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <Image
                src={logoSrc}
                alt="Chronodil Logo"
                width={180}
                height={60}
                className="h-16 w-auto"
                priority
              />
            </div>
            <CardDescription className="text-center font-heading">
              Définissez votre nouveau mot de passe
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmitConfirm(onConfirmReset)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  {...registerConfirm("password")}
                  disabled={isLoading}
                />
                {errorsConfirm.password && (
                  <p className="text-sm text-destructive">{errorsConfirm.password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...registerConfirm("confirmPassword")}
                  disabled={isLoading}
                />
                {errorsConfirm.confirmPassword && (
                  <p className="text-sm text-destructive">{errorsConfirm.confirmPassword.message}</p>
                )}
              </div>
              <Input
                type="hidden"
                {...registerConfirm("token")}
              />
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary"
                disabled={isLoading}
              >
                {isLoading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                <Link href="/auth/login" className="text-primary hover:text-primary font-medium">
                  Retour à la connexion
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  // Si l'email a été envoyé, afficher un message de confirmation
  if (emailSent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 pb-24 relative overflow-hidden" style={{ backgroundColor: 'hsl(141, 78.9%, 90%)' }}>
        <Card className="w-full max-w-md relative z-10">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <Image
                src={logoSrc}
                alt="Chronodil Logo"
                width={180}
                height={60}
                className="h-16 w-auto"
                priority
              />
            </div>
            <CardTitle className="text-center">Email envoyé !</CardTitle>
            <CardDescription className="text-center font-heading mt-4">
              Vérifiez votre boîte de réception. Un lien de réinitialisation a été envoyé à votre adresse email.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col space-y-4">
            <Link href="/auth/login" className="w-full">
              <Button
                type="button"
                variant="outline"
                className="w-full"
              >
                Retour à la connexion
              </Button>
            </Link>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setEmailSent(false)}
            >
              Renvoyer l'email
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Formulaire de demande de réinitialisation
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pb-24 relative overflow-hidden" style={{ backgroundColor: 'hsl(141, 78.9%, 90%)' }}>
      {/* Grille interactive */}
      <div className="absolute inset-x-0 inset-y-[-30%] h-[200%] skew-y-12 opacity-60">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 600">
          {Array.from({ length: 12 * 12 }).map((_, index) => {
            const x = (index % 12) * 50;
            const y = Math.floor(index / 12) * 50;
            return (
              <rect
                key={index}
                x={x}
                y={y}
                width={50}
                height={50}
                className="stroke-white/50 fill-transparent hover:fill-white/60 transition-colors duration-300"
              />
            );
          })}
        </svg>
      </div>
      {/* Citation inspirante */}
      <div className="text-center mb-8 relative z-10 max-w-2xl mx-auto px-4">
        <div className="text-xl md:text-2xl text-gray-800 font-serif leading-relaxed min-h-[5rem] flex items-center justify-center">
          <TypingText
            text={[
              '"Réinitialisez votre mot de passe en toute sécurité."',
              '"Votre sécurité est notre priorité."',
              '"Un lien de réinitialisation vous sera envoyé."'
            ]}
            as="blockquote"
            className="text-center font-serif tracking-wide"
            typingSpeed={60}
            pauseDuration={3500}
            deletingSpeed={30}
            initialDelay={1200}
            showCursor={true}
            cursorCharacter="|"
            cursorClassName="text-primary font-bold"
            textColors={['text-gray-800', 'text-primary', 'text-gray-700']}
            loop={true}
          />
        </div>
        <div className="mt-4 flex items-center justify-center space-x-2">
          <div className="w-8 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <div className="w-8 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        </div>
      </div>

      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Image
              src={logoSrc}
              alt="Chronodil Logo"
              width={180}
              height={60}
              className="h-16 w-auto"
              priority
            />
          </div>
          <CardDescription className="text-center font-heading">
            Entrez votre adresse email pour recevoir un lien de réinitialisation
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmitRequest(onRequestReset)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nom@exemple.com"
                {...registerRequest("email")}
                disabled={isLoading}
              />
              {errorsRequest.email && (
                <p className="text-sm text-destructive">{errorsRequest.email.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary"
              disabled={isLoading}
            >
              {isLoading ? "Envoi..." : "Envoyer le lien de réinitialisation"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Vous vous souvenez de votre mot de passe ?{" "}
              <Link href="/auth/login" className="text-primary hover:text-primary font-medium">
                Se connecter
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      
      {/* Pied de page */}
      <footer className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-sm text-gray-600 flex items-center space-x-2 z-10">
        <span>&copy; 2025 by </span>
        <Image
          src="/assets/media/logo d'odillon corrigé.png"
          alt="ODILLON Logo"
          width={250}
          height={80}
          className="h-12 w-auto"
        />
      </footer>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Chargement...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

