"use client";

import { useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Cropper, CropperRef } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";
import { Button } from "@/components/ui/button";
import { Check, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface ImageCropperProps {
  src: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onCancel: () => void;
  /** Height of the cropper area */
  height?: string;
  /** Whether to show action buttons (default: true) */
  showActions?: boolean;
  /** Custom class name */
  className?: string;
  /** Compact mode - smaller buttons and spacing */
  compact?: boolean;
}

export interface ImageCropperRef {
  crop: () => void;
}

export const ImageCropper = forwardRef<ImageCropperRef, ImageCropperProps>(
  ({ src, onCropComplete, onCancel, height = "h-64 sm:h-80", showActions = true, className, compact = false }, ref) => {
    const cropperRef = useRef<CropperRef>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCrop = () => {
      const cropper = cropperRef.current;
      if (cropper) {
        setIsProcessing(true);
        try {
          const canvas = cropper.getCanvas();
          if (canvas) {
            const croppedImageUrl = canvas.toDataURL("image/png");
            onCropComplete(croppedImageUrl);
          }
        } catch (error) {
          console.error("Erreur lors du recadrage:", error);
        } finally {
          setIsProcessing(false);
        }
      }
    };

    useImperativeHandle(ref, () => ({ crop: handleCrop }));

    const handleZoom = (delta: number) => {
      const cropper = cropperRef.current;
      if (cropper) {
        cropper.zoomImage(delta);
      }
    };

    const handleReset = () => {
      const cropper = cropperRef.current;
      if (cropper) {
        cropper.reset();
      }
    };

    return (
      <div className={cn("flex flex-col gap-3", className)}>
        {/* Cropper area */}
        <div className={cn("relative w-full rounded-lg overflow-hidden bg-muted/50 border", height)}>
          <Cropper
            ref={cropperRef}
            src={src}
            stencilProps={{ aspectRatio: 1 }}
            className="h-full w-full"
          />
        </div>

        {/* Zoom controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size={compact ? "sm" : "default"}
            onClick={() => handleZoom(-0.1)}
            className={compact ? "h-8 w-8 p-0" : "h-9 w-9 p-0"}
          >
            <ZoomOut className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size={compact ? "sm" : "default"}
            onClick={() => handleZoom(0.1)}
            className={compact ? "h-8 w-8 p-0" : "h-9 w-9 p-0"}
          >
            <ZoomIn className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size={compact ? "sm" : "default"}
            onClick={handleReset}
            className={compact ? "h-8 w-8 p-0" : "h-9 w-9 p-0"}
          >
            <RotateCcw className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </Button>
        </div>

        {/* Instructions */}
        <p className={cn("text-center text-muted-foreground", compact ? "text-xs" : "text-sm")}>
          Déplacez et redimensionnez la zone pour recadrer
        </p>

        {/* Action buttons */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1"
              size={compact ? "sm" : "default"}
            >
              <X className={cn("mr-2", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleCrop}
              disabled={isProcessing}
              className="flex-1"
              size={compact ? "sm" : "default"}
            >
              {isProcessing ? (
                <Spinner className="mr-2" />
              ) : (
                <Check className={cn("mr-2", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
              )}
              Valider
            </Button>
          </div>
        )}
      </div>
    );
  }
);

ImageCropper.displayName = "ImageCropper";