"use client";

import { useRef, useState } from "react";
import { Cropper, CropperRef } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { SpinnerCustom } from "@/components/features/loading-spinner";

interface ImageCropperProps {
  src: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onCancel: () => void;
}

export function ImageCropper({ src, onCropComplete, onCancel }: ImageCropperProps) {
  const cropperRef = useRef<CropperRef>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCrop = () => {
    const cropper = cropperRef.current;
    if (cropper) {
      setIsProcessing(true);
      
      try {
        const canvas = cropper.getCanvas();
        if (canvas) {
          const croppedImageUrl = canvas.toDataURL('image/png');
          onCropComplete(croppedImageUrl);
        }
      } catch (error) {
        console.error("Erreur lors du recadrage:", error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Recadrer votre image</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isProcessing}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleCrop}
              disabled={isProcessing}
              className="bg-primary hover:bg-primary"
            >
              {isProcessing ? (
                <>
                  <SpinnerCustom />
                  Recadrage...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Valider
                </>
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative h-96 border rounded-lg overflow-hidden bg-muted">
          <Cropper
            ref={cropperRef}
            src={src}
            stencilProps={{
              aspectRatio: 1,
            }}
            className="h-full w-full"
          />
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p>• Déplacez et redimensionnez la zone de recadrage</p>
          <p>• L'image sera automatiquement recadrée en format carré</p>
          <p>• Cliquez sur "Valider" pour confirmer le recadrage</p>
        </div>
      </CardContent>
    </Card>
  );
}