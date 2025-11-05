import { useEffect, useState } from "react";

/**
 * Hook pour débouncer une valeur
 * @param value - La valeur à débouncer
 * @param delay - Le délai en millisecondes
 * @returns La valeur débouncée
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

