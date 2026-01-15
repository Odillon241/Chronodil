"use client";

import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
    children: ReactNode;
    showRadialGradient?: boolean;
}

export const AuroraBackground = ({
    className,
    children,
    showRadialGradient = true,
    ...props
}: AuroraBackgroundProps) => {
    return (
        <div
            className={cn(
                "relative flex flex-col min-h-screen items-center justify-center bg-muted/40 text-foreground transition-bg overflow-hidden",
                className
            )}
            {...props}
        >
            <style jsx>{`
        @keyframes aurora {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .aurora-effect {
          animation: aurora 15s ease-in-out infinite;
        }
      `}</style>
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className={cn(
                        "aurora-effect absolute -inset-[10px] opacity-[0.06] dark:opacity-[0.10] blur-[40px] will-change-transform",
                        showRadialGradient &&
                        "[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]"
                    )}
                    style={{
                        background: `repeating-linear-gradient(
              100deg,
              hsl(75 62% 46%) 5%,
              hsl(85 60% 50%) 15%,
              hsl(95 55% 45%) 25%,
              hsl(85 60% 50%) 35%,
              hsl(75 62% 46%) 45%
            )`,
                        backgroundSize: "300% 300%",
                    }}
                />
            </div>
            {children}
        </div>
    );
};
