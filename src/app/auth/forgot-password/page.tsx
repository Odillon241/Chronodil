"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { resetPassword } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalide"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);

    try {
      const { error } = await resetPassword(data.email);

      if (error) {
        let errorMessage = error.message;
        if (errorMessage.includes("User not found")) {
          errorMessage = "Aucun compte n'est associé à cet email";
        } else if (errorMessage.includes("rate limit")) {
          errorMessage = "Trop de demandes. Veuillez patienter quelques minutes.";
        }
        toast.error(errorMessage);
        return;
      }

      toast.success("Code envoyé ! Vérifiez votre boîte de réception.");
      // Rediriger vers la page de vérification OTP
      router.push(`/auth/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

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
            "Envoyer le code de vérification"
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
