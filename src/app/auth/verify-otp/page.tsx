"use client";

import { useState, Suspense, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { verifyOtpForRecovery } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Loader2, KeyRound, ArrowLeft } from "lucide-react";

// ============================================================================
// Constantes
// ============================================================================

const QUOTES = [
  '"Entrez le code reçu par email."',
  '"Sécurité renforcée pour votre compte."',
  '"Plus qu\'une étape avant la réinitialisation."',
];

// Supabase utilise 8 chiffres pour les codes de récupération de mot de passe
const OTP_LENGTH = 8;

// ============================================================================
// Schéma de validation
// ============================================================================

const otpSchema = z.string().length(OTP_LENGTH, `Le code doit contenir ${OTP_LENGTH} chiffres`);

// ============================================================================
// Composant OTP Input
// ============================================================================

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  onComplete?: (value: string) => void;
}

function OtpInput({ value, onChange, disabled, onComplete }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, char: string) => {
    // Accepter uniquement les chiffres
    if (char && !/^\d$/.test(char)) return;

    const newValue = value.split("");
    newValue[index] = char;
    const result = newValue.join("");
    onChange(result);

    // Focus sur le prochain input si un chiffre est entré
    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Appeler onComplete si le code est complet
    if (result.length === OTP_LENGTH && result.indexOf("") === -1) {
      onComplete?.(result);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Retour arrière : effacer et focus sur le précédent
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Flèche gauche
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Flèche droite
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, OTP_LENGTH);
    if (/^\d+$/.test(pastedData)) {
      onChange(pastedData.padEnd(OTP_LENGTH, ""));
      if (pastedData.length === OTP_LENGTH) {
        onComplete?.(pastedData);
      }
    }
  };

  return (
    <div className="flex justify-center items-center gap-1.5 sm:gap-2">
      {/* Premier groupe de 4 chiffres */}
      {Array.from({ length: 4 }).map((_, index) => (
        <Input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-9 h-11 sm:w-10 sm:h-12 text-center text-lg sm:text-xl font-bold p-0"
          autoComplete="one-time-code"
        />
      ))}
      
      {/* Séparateur */}
      <span className="text-2xl text-muted-foreground font-light mx-1">-</span>
      
      {/* Deuxième groupe de 4 chiffres */}
      {Array.from({ length: 4 }).map((_, idx) => {
        const index = idx + 4;
        return (
          <Input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[index] || ""}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className="w-9 h-11 sm:w-10 sm:h-12 text-center text-lg sm:text-xl font-bold p-0"
            autoComplete="one-time-code"
          />
        );
      })}
    </div>
  );
}

// ============================================================================
// Composant principal
// ============================================================================

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupérer l'email depuis les query params
  const email = searchParams.get("email") || "";

  // Rediriger si pas d'email
  useEffect(() => {
    if (!email) {
      toast.error("Email manquant. Veuillez recommencer.");
      router.push("/auth/forgot-password");
    }
  }, [email, router]);

  const handleVerify = async (code?: string) => {
    const otpToVerify = code || otp;
    setError(null);

    // Validation
    const result = otpSchema.safeParse(otpToVerify);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const { error: verifyError } = await verifyOtpForRecovery(email, otpToVerify);

      if (verifyError) {
        console.error("Erreur de vérification OTP:", verifyError);
        setError("Code invalide ou expiré. Veuillez réessayer.");
        toast.error("Code invalide ou expiré");
        return;
      }

      toast.success("Code vérifié ! Vous pouvez maintenant réinitialiser votre mot de passe.");
      router.push("/auth/reset-password");
    } catch (err) {
      console.error("Erreur:", err);
      setError("Une erreur s'est produite");
      toast.error("Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error?.message || "Erreur lors du renvoi");
        return;
      }

      toast.success("Un nouveau code a été envoyé !");
      setOtp("");
      setError(null);
    } catch (err) {
      console.error("Erreur:", err);
      toast.error("Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return (
      <AuthLayout showBackground={false}>
        <Card className="w-full max-w-md relative z-10">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Redirection...</p>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout quotes={QUOTES}>
      <Card className="w-full max-w-lg relative z-10">
        <CardHeader className="space-y-1">
          <div className="mb-4">
            <AuthLogo />
          </div>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-center">Vérification du code</CardTitle>
          <CardDescription className="text-center font-heading">
            Un code à 8 chiffres a été envoyé à
            <br />
            <strong className="text-foreground">{email}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <OtpInput
            value={otp}
            onChange={setOtp}
            disabled={isLoading}
            onComplete={handleVerify}
          />

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button
            onClick={() => handleVerify()}
            className="w-full"
            disabled={isLoading || otp.length !== OTP_LENGTH}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Vérification...
              </>
            ) : (
              "Vérifier le code"
            )}
          </Button>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            Vous n'avez pas reçu le code ?{" "}
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isLoading}
              className="text-primary hover:text-primary/80 font-medium underline disabled:opacity-50"
            >
              Renvoyer
            </button>
          </div>

          <Link
            href="/auth/forgot-password"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Changer d'adresse email
          </Link>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}

// ============================================================================
// Page exportée avec Suspense
// ============================================================================

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
