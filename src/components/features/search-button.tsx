"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchButtonProps {
  onClick?: () => void;
  className?: string;
}

export function SearchButton({ onClick, className }: SearchButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "relative h-9 w-full justify-start rounded-md border bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-64 lg:w-80",
        className
      )}
      onClick={onClick}
    >
      <Search className="mr-2 h-4 w-4" />
      <span className="hidden sm:inline-flex">Rechercher...</span>
      <span className="hidden sm:inline-flex sm:ml-auto">
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </span>
    </Button>
  );
}

