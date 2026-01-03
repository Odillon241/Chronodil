"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";

// ============================================================================
// Constantes
// ============================================================================

const QUOTES = [
  '"Réinitialisez votre mot de passe en toute sécurité."',
  '"Votre sécurité est notre priorité."',
  '"Un code de vérification vous sera envoyé."',
];

// ============================================================================
// Schéma de validation
// ============================================================================

const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalide"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ============================================================================
// Composant Email Envoyé
// ============================================================================

interface EmailSentStateProps {
  email: string;
  onResend: () => void;
  onContinue: () => void;
}

function EmailSentState({ email, onResend, onContinue }: EmailSentStateProps) {
  return (
    <AuthLayout showBackground={false}>
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="space-y-1">
          <div className="mb-4">
            <AuthLogo />
          </div>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-center">Code envoyé !</CardTitle>
          <CardDescription className="text-center font-heading mt-4">
            Un code de vérification a été envoyé à
            <br />
            <strong className="text-foreground">{email}</strong>
            <br />
            <br />
            Vérifiez votre boîte de réception et entrez le code sur la page
            suivante.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="button" className="w-full" onClick={onContinue}>
            Entrer le code
          </Button>
          <Link href="/auth/login" className="w-full">
            <Button type="button" variant="outline" className="w-full">
              Retour à la connexion
            </Button>
          </Link>
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
            onClick={onResend}
          >
            Renvoyer le code
          </button>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}

// ============================================================================
// Composant Formulaire
// ============================================================================

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const sendResetEmail = async (emailToSend: string) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToSend }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(
          result.error?.message || "Erreur lors de l'envoi de l'email"
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur s'est produite");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setEmail(data.email);
    const success = await sendResetEmail(data.email);

    if (success) {
      setEmailSent(true);
      toast.success("Code envoyé ! Vérifiez votre boîte de réception.");
    }
  };

  const handleResend = async () => {
    if (email) {
      const success = await sendResetEmail(email);
      if (success) {
        toast.success("Un nouveau code a été envoyé !");
      }
    }
  };

  const handleContinue = () => {
    router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
  };

  // Si l'email a été envoyé avec succès
  if (emailSent) {
    return (
      <EmailSentState
        email={email}
        onResend={handleResend}
        onContinue={handleContinue}
      />
    );
  }

  // Formulaire de demande de réinitialisation
  return (
    <AuthLayout quotes={QUOTES}>
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="space-y-1">
          <div className="mb-4">
            <AuthLogo />
          </div>
          <CardTitle className="text-center">Mot de passe oublié ?</CardTitle>
          <CardDescription className="text-center font-heading">
            Entrez votre email pour recevoir un code de vérification
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nom@exemple.com"
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                "Envoyer le code"
              )}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Vous vous souvenez de votre mot de passe ?{" "}
              <Link
                href="/auth/login"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Se connecter
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  );
}
