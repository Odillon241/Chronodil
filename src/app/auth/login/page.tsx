"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "next-themes";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import TypingText from "@/components/ui/shadcn-io/typing-text";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Éviter le mismatch d'hydratation en utilisant mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Utiliser le logo clair par défaut pour éviter le mismatch d'hydratation
  // Une fois monté, on peut utiliser le thème résolu
  const logoSrc = mounted && resolvedTheme === "dark" 
    ? "/assets/media/logo-dark.svg" 
    : "/assets/media/logo.svg";

  console.log("LoginPage rendered");

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
      const result = await signIn.email({
        email: data.email,
        password: data.password,
      });

      if (result.error) {
        toast.error(result.error.message || "Échec de la connexion");
      } else {
        toast.success("Connexion réussie !");
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error("Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

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
      {/* Citation inspirante avec effet de frappe */}
      <div className="text-center mb-8 relative z-10 max-w-2xl mx-auto px-4">
        <div className="text-xl md:text-2xl text-gray-800 font-serif leading-relaxed min-h-[5rem] flex items-center justify-center">
          <TypingText
            text={[
              '"Le temps est la ressource la plus précieuse que nous ayons."',
              '"Chronodil vous aide à la maîtriser."',
              '"Optimisez votre productivité avec nous."'
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
            Connectez-vous à votre compte
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <Link
                  href="/auth/reset-password"
                  className="text-sm text-primary hover:text-primary"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                {...register("password")}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary"
              disabled={isLoading}
            >
              {isLoading ? "Connexion..." : "Se connecter"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Vous n'avez pas de compte ?{" "}
              <Link href="/auth/register" className="text-primary hover:text-primary font-medium">
                S'inscrire
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      
      {/* Pied de page avec copyright */}
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
