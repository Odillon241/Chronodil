"use client";

import { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useDebounce } from "@/hooks/use-debounce";

interface SettingsSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  description?: string;
  onValueChange: (value: number) => void;
  onValueChangeImmediate?: (value: number) => void;
  disabled?: boolean;
  formatValue?: (value: number) => string;
}

export function SettingsSlider({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  description,
  onValueChange,
  onValueChangeImmediate,
  disabled = false,
  formatValue,
}: SettingsSliderProps) {
  // État local pour une interaction fluide
  const [localValue, setLocalValue] = useState(value);

  // Synchroniser l'état local avec la valeur externe
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce de la valeur pour éviter trop d'appels à onValueChange
  const debouncedValue = useDebounce(localValue, 200);

  // Appeler onValueChange avec la valeur débouncée (pour la sauvegarde)
  useEffect(() => {
    if (debouncedValue !== value && debouncedValue >= min && debouncedValue <= max) {
      onValueChange(debouncedValue);
    }
  }, [debouncedValue, value, min, max, onValueChange]);

  // Handler pour le changement immédiat (affichage + application visuelle)
  const handleValueChange = useCallback((newValue: number[]) => {
    const newVal = newValue[0];
    setLocalValue(newVal);
    
    // Appliquer immédiatement si un handler est fourni (pour les changements visuels)
    if (onValueChangeImmediate) {
      onValueChangeImmediate(newVal);
    }
  }, [onValueChangeImmediate]);

  // Formater la valeur affichée
  const displayValue = formatValue ? formatValue(localValue) : `${localValue}${unit}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-base font-semibold">
          {label}: {displayValue}
        </Label>
      </div>
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        value={[localValue]}
        onValueChange={handleValueChange}
        disabled={disabled}
        className="w-full"
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

