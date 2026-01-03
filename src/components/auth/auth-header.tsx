"use client";

import TypingText from "@/components/ui/shadcn-io/typing-text";

interface AuthHeaderProps {
  /** Liste de citations à afficher en rotation */
  quotes: string[];
}

/**
 * En-tête avec citation inspirante et effet de frappe
 */
export function AuthHeader({ quotes }: AuthHeaderProps) {
  return (
    <div className="text-center mb-8 relative z-10 max-w-2xl mx-auto px-4">
      <div className="text-xl md:text-2xl text-gray-800 font-serif leading-relaxed min-h-[5rem] flex items-center justify-center">
        <TypingText
          text={quotes}
          as="blockquote"
          className="text-center font-serif tracking-wide"
          typingSpeed={60}
          pauseDuration={3500}
          deletingSpeed={30}
          initialDelay={1200}
          showCursor={true}
          cursorCharacter="|"
          cursorClassName="text-primary font-bold"
          textColors={["text-gray-800", "text-primary", "text-gray-700"]}
          loop={true}
        />
      </div>
      <div className="mt-4 flex items-center justify-center space-x-2">
        <div className="w-8 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        <div className="w-8 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
      </div>
    </div>
  );
}
