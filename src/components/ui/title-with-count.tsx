import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface TitleWithCountProps {
  /**
   * Le texte du titre (ex: "Utilisateurs", "Tâches", "Projets")
   */
  title: string;
  /**
   * Le nombre à afficher dans une bulle de verre
   */
  count: number;
  /**
   * Classes CSS supplémentaires pour le conteneur
   */
  className?: string;
  /**
   * Classes CSS supplémentaires pour le titre
   */
  titleClassName?: string;
  /**
   * Classes CSS supplémentaires pour la bulle de compteur
   */
  countClassName?: string;
  /**
   * Afficher le compteur même s'il est à 0 (par défaut: true)
   */
  showZero?: boolean;
  /**
   * Format personnalisé pour le nombre (optionnel)
   */
  formatCount?: (count: number) => string | number;
  /**
   * Contenu optionnel à afficher après le compteur
   */
  children?: ReactNode;
  /**
   * Variante de style pour la bulle (par défaut: "glass")
   */
  variant?: "glass" | "solid" | "outline";
}

/**
 * Composant réutilisable pour afficher un titre avec un compteur dans une bulle de verre.
 * 
 * @example
 * <TitleWithCount title="Utilisateurs" count={users.length} />
 * // Affiche: "Utilisateurs" avec une bulle de verre contenant "5"
 * 
 * @example
 * <TitleWithCount 
 *   title="Tâches" 
 *   count={tasks.length} 
 *   className="text-lg sm:text-xl"
 * />
 */
export function TitleWithCount({
  title,
  count,
  className,
  titleClassName,
  countClassName,
  showZero = true,
  formatCount,
  children,
  variant = "glass",
}: TitleWithCountProps) {
  const displayCount = formatCount ? formatCount(count) : count;
  const shouldShowCount = showZero || count > 0;

  // Styles pour les différentes variantes
  const variantStyles = {
    glass: cn(
      "inline-flex items-center justify-center min-w-[2rem] h-6 px-2.5 rounded-md",
      "bg-blue-100/80 dark:bg-blue-900/40",
      "backdrop-blur-md",
      "border border-blue-200/50 dark:border-blue-700/50",
      "text-sm font-semibold text-blue-700 dark:text-blue-300",
      "shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)]",
      "transition-all duration-200"
    ),
    solid: cn(
      "inline-flex items-center justify-center min-w-[2rem] h-6 px-2.5 rounded-md",
      "bg-primary/10 text-primary",
      "text-sm font-medium"
    ),
    outline: cn(
      "inline-flex items-center justify-center min-w-[2rem] h-6 px-2.5 rounded-md",
      "border border-border",
      "bg-transparent",
      "text-sm font-medium text-muted-foreground"
    ),
  };

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className={titleClassName}>{title}</span>
      {shouldShowCount && (
        <span className={cn(variantStyles[variant], countClassName)}>
          {displayCount}
        </span>
      )}
      {children}
    </span>
  );
}

