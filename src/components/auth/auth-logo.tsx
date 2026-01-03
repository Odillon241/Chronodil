"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Image from "next/image";

interface AuthLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

/**
 * Logo Chronodil avec support du thème dark/light
 * Gère l'hydratation correctement pour éviter les mismatches
 */
export function AuthLogo({ className = "h-16 w-auto", width = 180, height = 60 }: AuthLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc = mounted && resolvedTheme === "dark"
    ? "/assets/media/logo-dark.svg"
    : "/assets/media/logo.svg";

  return (
    <div className="flex items-center justify-center">
      <Image
        src={logoSrc}
        alt="Chronodil Logo"
        width={width}
        height={height}
        className={className}
        priority
      />
    </div>
  );
}
