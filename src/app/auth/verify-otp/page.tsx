"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, ArrowLeft, KeyRound, RefreshCw } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState(["", "", "", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown pour le renvoi
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Rediriger si pas d'email
  useEffect(() => {
    if (!email) {
      router.push("/auth/forgot-password");
    }
  }, [email, router]);

  const handleChange = (index: number, value: string) => {
    // Accepter uniquement les chiffres
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus sur le champ suivant
    if (value && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit si tous les champs sont remplis
    if (newOtp.every((digit) => digit !== "") && value) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8);

    if (pastedData.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length && i < 8; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);

      // Focus sur le dernier champ rempli ou le suivant
      const nextIndex = Math.min(pastedData.length, 7);
      inputRefs.current[nextIndex]?.focus();

      // Auto-submit si complet
      if (pastedData.length === 8) {
        handleVerify(pastedData);
      }
    }
  };

  const handleVerify = async (otpCode: string) => {
    if (otpCode.length !== 8) {
      toast.error("Veuillez entrer le code complet à 8 chiffres");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      // Vérifier l'OTP avec Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: "recovery",
      });

      if (error) {
        console.error("[Verify OTP] Error:", error.message);

        let errorMessage = "Code invalide ou expiré";
        if (error.message.includes("expired")) {
          errorMessage = "Le code a expiré. Demandez un nouveau code.";
        } else if (error.message.includes("invalid")) {
          errorMessage = "Code incorrect. Vérifiez et réessayez.";
        }

        toast.error(errorMessage);
        // Réinitialiser les champs
        setOtp(["", "", "", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      if (data.session) {
        toast.success("Code vérifié ! Définissez votre nouveau mot de passe.");
        router.push("/auth/reset-password");
      }
    } catch (error) {
      console.error("[Verify OTP] Error:", error);
      toast.error("Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    setIsResending(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        toast.error("Erreur lors de l'envoi. Réessayez plus tard.");
        return;
      }

      toast.success("Nouveau code envoyé !");
      setCountdown(60); // 60 secondes avant prochain renvoi
      setOtp(["", "", "", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error) {
      console.error("[Resend OTP] Error:", error);
      toast.error("Une erreur s'est produite");
    } finally {
      setIsResending(false);
    }
  };

  const otpValue = otp.join("");

  return (
    <AuthLayout
      title="Vérification du code"
      description={`Code envoyé à ${email}`}
    >
      <div className="space-y-6">
        {/* Icône */}
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-3">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
        </div>

        {/* Instructions */}
        <p className="text-center text-sm text-muted-foreground">
          Entrez le code à 8 chiffres reçu par email
        </p>

        {/* Champs OTP */}
        <div className="flex justify-center gap-2">
          {otp.map((digit, index) => (
            <div key={index} className="relative">
              <Input
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                disabled={isLoading}
                className="h-12 w-10 text-center text-lg font-semibold bg-transparent"
                autoFocus={index === 0}
              />
              {/* Séparateur après le 4ème chiffre */}
              {index === 3 && (
                <span className="absolute -right-2 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                  -
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Bouton de vérification */}
        <Button
          onClick={() => handleVerify(otpValue)}
          className="w-full"
          disabled={isLoading || otpValue.length !== 8}
          size="lg"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Vérification...
            </span>
          ) : (
            "Vérifier le code"
          )}
        </Button>

        {/* Renvoyer le code */}
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={handleResend}
            disabled={isResending || countdown > 0}
            className="text-muted-foreground hover:text-primary"
            size="sm"
          >
            {isResending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Envoi...
              </span>
            ) : countdown > 0 ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-3 w-3" />
                Renvoyer dans {countdown}s
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-3 w-3" />
                Renvoyer le code
              </span>
            )}
          </Button>
        </div>

        {/* Retour */}
        <div className="pt-2 text-center">
          <Link
            href="/auth/forgot-password"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Changer d'adresse email
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-muted/40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyOTPContent />
    </Suspense>
  );
}
