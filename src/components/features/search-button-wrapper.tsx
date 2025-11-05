"use client";

import { SearchButton } from "./search-button";

export function SearchButtonWrapper() {
  const handleClick = () => {
    // Déclencher un événement personnalisé pour ouvrir le CommandPalette
    const event = new CustomEvent("open-search");
    document.dispatchEvent(event);
  };

  return <SearchButton onClick={handleClick} />;
}

