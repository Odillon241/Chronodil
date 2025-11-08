"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchButtonProps {
  onClick?: () => void;
  className?: string;
}

function useIsMac() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    const platform = navigator.platform.toUpperCase();
    const isMacPlatform = platform.includes("MAC") || platform === "MACINTOSH";
    setIsMac(isMacPlatform);
  }, []);

  return isMac;
}

export function SearchButton({ onClick, className }: SearchButtonProps) {
  const isMac = useIsMac();

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "relative h-9 w-full justify-between rounded-md border bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-2 md:w-64 lg:w-80",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline-flex">Rechercher...</span>
      </div>
      <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
        {isMac ? (
          <>
            <span className="text-xs">⌘</span>
            <span className="text-xs">K</span>
          </>
        ) : (
          <>
            <span className="text-xs">Ctrl</span>
            <span className="text-xs">K</span>
          </>
        )}
      </kbd>
    </Button>
  );
}

