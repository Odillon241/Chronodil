"use client";

import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Rechercher...",
  className = "",
  inputClassName = "",
}: SearchBarProps) {
  return (
    <div className={`relative w-full ${className}`}>
      <Input
        type="text"
        placeholder={placeholder}
        className={inputClassName}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
