"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "next-themes";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import TypingText from "@/components/ui/shadcn-io/typing-text";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

// Schéma de validation
const resetPasswordSchema = z.object({
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
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
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Vérifier la validité du token
  useEffect(() => {
    const verifyToken = async () => {
      setIsValidating(true);

      try {
        // Récupérer le token depuis l'URL
        const tokenParam = searchParams.get("token");

        if (!tokenParam) {
          console.error("Token manquant dans l'URL");
          setIsValidToken(false);
          setIsValidating(false);
          toast.error("Lien invalide. Demandez un nouveau lien de réinitialisation.");
          return;
        }

        setToken(tokenParam);
        setIsValidToken(true);
      } catch (error) {
        console.error("Erreur lors de la vérification:", error);
        setIsValidToken(false);
        toast.error("Une erreur s'est produite");
      } finally {
        setIsValidating(false);
      }
    };

    verifyToken();
  }, [searchParams]);

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) {
      toast.error("Token manquant");
      return;
    }

    setIsLoading(true);

    try {
      // Appeler Better Auth pour réinitialiser le mot de passe
      const { data: result, error } = await authClient.resetPassword({
        newPassword: data.password,
        token,
      });

      if (error) {
        toast.error(error.message || "Erreur lors de la réinitialisation");
        return;
      }

      setResetSuccess(true);
      toast.success("Mot de passe réinitialisé avec succès!");

      // Rediriger vers la page de login après 2 secondes
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error("Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  // État de validation (affiche un spinner)
  if (isValidating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 pb-24 relative overflow-hidden" style={{ backgroundColor: 'hsl(141, 78.9%, 90%)' }}>
        <Card className="w-full max-w-md relative z-10">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Vérification du lien...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Token invalide ou expiré
  if (!isValidToken) {
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
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-center">Lien invalide ou expiré</CardTitle>
            <CardDescription className="text-center font-heading mt-4">
              Ce lien de réinitialisation n'est plus valide. Il a peut-être expiré ou a déjà été utilisé.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col space-y-4">
            <Link href="/auth/forgot-password" className="w-full">
              <Button
                type="button"
                className="w-full bg-primary hover:bg-primary"
              >
                Demander un nouveau lien
              </Button>
            </Link>
            <Link href="/auth/login" className="w-full">
              <Button
                type="button"
                variant="outline"
                className="w-full"
              >
                Retour à la connexion
              </Button>
            </Link>
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

  // Succès - Mot de passe réinitialisé
  if (resetSuccess) {
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
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-center">Mot de passe réinitialisé !</CardTitle>
            <CardDescription className="text-center font-heading mt-4">
              Votre mot de passe a été réinitialisé avec succès.
              <br />
              <br />
              Vous allez être redirigé vers la page de connexion...
            </CardDescription>
          </CardHeader>
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

  // Formulaire de réinitialisation
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
              '"Créez un nouveau mot de passe sécurisé."',
              '"Votre sécurité est notre priorité."',
              '"Choisissez un mot de passe fort."'
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
                <p className="text-sm text-destructive">{errors.password.message}</p>
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
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
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
                  Réinitialisation...
                </>
              ) : (
                "Réinitialiser le mot de passe"
              )}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium">
                Retour à la connexion
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
