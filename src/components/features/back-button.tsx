"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  return (
    <Button
      variant="outline"
      onClick={() => window.history.back()}
      className="w-full sm:w-auto"
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Page précédente
    </Button>
  );
}
