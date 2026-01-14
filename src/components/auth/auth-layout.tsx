"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TypingText from "@/components/ui/shadcn-io/typing-text";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string | React.ReactNode;
  showSocialAuth?: boolean;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc = mounted && resolvedTheme === "dark"
    ? "/assets/media/logo-dark.svg"
    : "/assets/media/logo.svg";

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 bg-muted/40">
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <Link href="/" className="mb-4 transition-opacity hover:opacity-90">
            <Image
              src={logoSrc}
              alt="Chronodil Logo"
              width={180}
              height={50}
              className="h-12 w-auto"
              priority
            />
          </Link>
        </div>

        <div className="mb-6 flex flex-col items-center space-y-4">
          <h1 className="text-2xl font-bold tracking-tight text-primary">Bienvenue sur Chronodil</h1>
          <div className="flex justify-center items-center min-h-[40px] gap-2">
            <TypingText
              text={["TOGETHER WE"]}
              className="text-lg md:text-xl font-bold tracking-[0.15em] uppercase text-center font-mono text-foreground"
              typingSpeed={75}
              pauseDuration={1500}
              showCursor={false}
              loop={true}
              variableSpeed={{ min: 50, max: 120 }}
            />
            <img src="https://img.icons8.com/?id=36871&format=png&size=48" alt="write" className="h-6 w-6 md:h-7 md:w-7 inline-block" />
            <TypingText
              text={["THE FUTURE"]}
              className="text-lg md:text-xl font-bold tracking-[0.15em] uppercase text-center font-mono text-foreground"
              typingSpeed={75}
              pauseDuration={1500}
              showCursor={true}
              cursorCharacter="|"
              cursorClassName="h-6 md:h-7"
              loop={true}
              variableSpeed={{ min: 50, max: 120 }}
            />
          </div>
        </div>

        <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-background/95">
          <CardHeader className="space-y-1 text-center pb-2">
            <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
            {description && (
              <CardDescription className="text-muted-foreground">
                {description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {children}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} ODILLON. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}
