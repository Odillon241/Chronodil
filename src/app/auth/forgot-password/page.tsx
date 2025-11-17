"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "next-themes";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import TypingText from "@/components/ui/shadcn-io/typing-text";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";

// Schéma de validation
const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalide"),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Éviter le mismatch d'hydratation
  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc = mounted && resolvedTheme === "dark"
    ? "/assets/media/logo-dark.svg"
    : "/assets/media/logo.svg";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    setEmail(data.email);

    try {
      // Appeler l'API Better Auth pour demander la réinitialisation
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error?.message || "Erreur lors de l'envoi de l'email");
        return;
      }

      setEmailSent(true);
      toast.success("Email envoyé! Vérifiez votre boîte de réception.");
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error("Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  // Si l'email a été envoyé avec succès
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
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Mail className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-center">Email envoyé !</CardTitle>
            <CardDescription className="text-center font-heading mt-4">
              Un email de réinitialisation a été envoyé à <strong>{email}</strong>.
              <br />
              <br />
              Cliquez sur le lien dans l'email pour réinitialiser votre mot de passe.
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
          <CardTitle className="text-center">Mot de passe oublié ?</CardTitle>
          <CardDescription className="text-center font-heading">
            Entrez votre email pour recevoir un lien de réinitialisation
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
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                "Envoyer le lien de réinitialisation"
              )}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Vous vous souvenez de votre mot de passe ?{" "}
              <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium">
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
