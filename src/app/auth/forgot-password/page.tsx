"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { resetPassword } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalide"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

function EmailSentState({ email, onResend, isResending }: { email: string, onResend: () => void, isResending: boolean }) {
  return (
    <AuthLayout title="Email envoyé !" description="Vérifiez votre boîte de réception">
      <div className="flex flex-col items-center space-y-6 text-center">
        <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/20">
          <Mail className="h-10 w-10 text-blue-600 dark:text-blue-500" />
        </div>

        <Alert className="bg-muted/50 border-primary/20 text-left">
          <AlertTitle>Lien de réinitialisation envoyé</AlertTitle>
          <AlertDescription className="mt-2 text-muted-foreground text-sm">
            Un email a été envoyé à <span className="font-semibold text-foreground">{email}</span>. Cliquez sur le lien pour définir un nouveau mot de passe.
            <br className="my-2" />
            <span className="text-xs italic opacity-80">(Le lien expire dans 1 heure)</span>
          </AlertDescription>
        </Alert>

        <div className="w-full space-y-4 pt-2">
          <Link href="/auth/login" className="w-full block">
            <Button variant="outline" className="w-full">
              Retour à la connexion
            </Button>
          </Link>

          <Button
            variant="ghost"
            onClick={onResend}
            disabled={isResending}
            className="text-muted-foreground hover:text-primary"
            size="sm"
          >
            {isResending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Envoi...
              </span>
            ) : (
              "Vous n'avez rien reçu ? Renvoyer l'email"
            )}
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const sendResetEmail = async (emailToSend: string, isResend = false) => {
    if (isResend) {
      setIsResending(true);
    } else {
      setIsLoading(true);
    }

    try {
      const { error } = await resetPassword(emailToSend);

      if (error) {
        let errorMessage = error.message;
        if (errorMessage.includes("User not found")) {
          errorMessage = "Aucun compte n'est associé à cet email";
        } else if (errorMessage.includes("rate limit")) {
          errorMessage = "Trop de demandes. Veuillez patienter quelques minutes.";
        }
        toast.error(errorMessage);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Une erreur s'est produite");
      return false;
    } finally {
      setIsLoading(false);
      setIsResending(false);
    }
  };

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setEmail(data.email);
    const success = await sendResetEmail(data.email);
    if (success) {
      setEmailSent(true);
      toast.success("Email envoyé ! Vérifiez votre boîte de réception.");
    }
  };

  const handleResend = async () => {
    if (email) {
      const success = await sendResetEmail(email, true);
      if (success) {
        toast.success("Un nouvel email a été envoyé !");
      }
    }
  };

  if (emailSent) {
    return <EmailSentState email={email} onResend={handleResend} isResending={isResending} />;
  }

  return (
    <AuthLayout
      title="Mot de passe oublié ?"
      description="Nous allons vous aider à le récupérer"
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
            <p className="text-sm text-destructive font-medium">
              {errors.email.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full mt-2" disabled={isLoading} size="lg">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Envoi en cours...
            </span>
          ) : (
            "Envoyer le lien de réinitialisation"
          )}
        </Button>

        <div className="pt-4 text-center">
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
