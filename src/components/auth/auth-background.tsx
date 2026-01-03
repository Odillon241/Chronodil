"use client";

/**
 * Composant de grille interactive pour les pages d'authentification
 */
export function AuthBackground() {
  return (
    <div className="absolute inset-x-0 inset-y-[-30%] h-[200%] skew-y-12 opacity-60">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 600">
        {Array.from({ length: 12 * 12 }).map((_, index) => {
          const x = (index % 12) * 50;
          const y = Math.floor(index / 12) * 50;
          return (
            <rect
              key={index}
              x={x}
              y={y}
              width={50}
              height={50}
              className="stroke-white/50 fill-transparent hover:fill-white/60 transition-colors duration-300"
            />
          );
        })}
      </svg>
    </div>
  );
}
