"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Download,
  File,
  Image as ImageIcon,
  FileText,
  Video,
  Music,
  Archive,
  FileSpreadsheet,
  Presentation,
  Eye,
  X,
  ExternalLink,
} from "lucide-react";
import { SpinnerCustom } from "@/components/features/loading-spinner";
import { toast } from "sonner";

interface Attachment {
  name: string;
  type: string;
  size: number;
  url: string;
}

interface ChatAttachmentViewerProps {
  attachment: Attachment;
  isCurrentUser?: boolean;
  className?: string;
}

// Fonction pour obtenir l'icône appropriée selon le type de fichier
const getFileIcon = (type: string) => {
  if (type.startsWith("image/")) return ImageIcon;
  if (type.startsWith("video/")) return Video;
  if (type.startsWith("audio/")) return Music;
  if (type.includes("pdf")) return FileText;
  if (type.includes("spreadsheet") || type.includes("excel") || type.includes("csv")) return FileSpreadsheet;
  if (type.includes("presentation") || type.includes("powerpoint")) return Presentation;
  if (type.includes("zip") || type.includes("rar") || type.includes("7z")) return Archive;
  return File;
};

// Fonction pour formater la taille du fichier
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// Fonction pour télécharger un fichier
const downloadFile = async (url: string, filename: string) => {
  try {
    // Si c'est une URL blob (fichier temporaire), utiliser la méthode classique
    if (url.startsWith("blob:")) {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.target = "_blank";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Pour les fichiers stockés, utiliser l'API de téléchargement
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Erreur lors du téléchargement");
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      link.target = "_blank";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Nettoyer l'URL blob
      window.URL.revokeObjectURL(downloadUrl);
    }
    
    toast.success("Téléchargement démarré");
  } catch (error) {
    console.error("Erreur lors du téléchargement:", error);
    toast.error("Erreur lors du téléchargement du fichier");
  }
};

// Fonction pour ouvrir le fichier dans un nouvel onglet
const openFileInNewTab = (url: string) => {
  window.open(url, "_blank", "noopener,noreferrer");
};

export function ChatAttachmentViewer({
  attachment,
  isCurrentUser = false,
  className,
}: ChatAttachmentViewerProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [fileUrl, setFileUrl] = useState<string>("");

  const FileIcon = getFileIcon(attachment.type);
  const isImage = attachment.type.startsWith("image/");
  const isVideo = attachment.type.startsWith("video/");
  const isAudio = attachment.type.startsWith("audio/");
  const isPDF = attachment.type.includes("pdf");
  const canPreview = isImage || isVideo || isAudio || isPDF;

  // Normaliser l'URL du fichier
  useEffect(() => {
    const normalizeUrl = (url: string) => {
      console.log("📎 URL reçue pour l'attachement:", url);
      
      // Si c'est une URL blob, elle n'est plus valide après rechargement
      // On ne devrait JAMAIS avoir d'URL blob ici après l'envoi du message
      if (url.startsWith("blob:")) {
        console.error("⚠️ URL blob détectée - cela ne devrait pas arriver. L'URL du serveur devrait être utilisée.");
        // Retourner une URL vide pour éviter l'erreur
        return "";
      }
      
      // Si c'est une URL relative, la rendre absolue
      if (url.startsWith("/")) {
        return url;
      }
      
      // Si c'est une URL complète, la retourner telle quelle
      if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
      }
      
      // Sinon, considérer que c'est un chemin relatif et ajouter le préfixe
      return `/${url}`;
    };

    const normalized = normalizeUrl(attachment.url);
    console.log("📎 URL normalisée:", normalized);
    setFileUrl(normalized);
  }, [attachment.url]);

  const handleDownload = () => {
    downloadFile(fileUrl, attachment.name);
  };

  const handlePreview = () => {
    if (canPreview) {
      setShowPreview(true);
      setPreviewError(false);
    } else {
      // Pour les fichiers non prévisualisables, ouvrir dans un nouvel onglet
      openFileInNewTab(fileUrl);
    }
  };

  const renderPreview = () => {
    if (!fileUrl) {
      return (
        <div className="flex items-center justify-center h-96">
          <SpinnerCustom />
        </div>
      );
    }

    if (previewError) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
          <File className="h-16 w-16 mb-4 opacity-50" />
          <p>Impossible de prévisualiser ce fichier</p>
          <Button
            variant="outline"
            onClick={() => openFileInNewTab(fileUrl)}
            className="mt-4"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Ouvrir dans un nouvel onglet
          </Button>
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="flex items-center justify-center max-h-[80vh]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fileUrl}
            alt={attachment.name}
            className="max-w-full max-h-full object-contain rounded-lg"
            onError={() => setPreviewError(true)}
          />
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="flex items-center justify-center max-h-[80vh]">
          <video
            controls
            className="max-w-full max-h-full rounded-lg"
            onError={() => setPreviewError(true)}
          >
            <source src={fileUrl} type={attachment.type} />
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>
        </div>
      );
    }

    if (isAudio) {
      return (
        <div className="flex flex-col items-center justify-center h-96">
          <Music className="h-16 w-16 mb-4 text-muted-foreground" />
          <audio
            controls
            className="w-full max-w-md"
            onError={() => setPreviewError(true)}
          >
            <source src={fileUrl} type={attachment.type} />
            Votre navigateur ne supporte pas la lecture audio.
          </audio>
          <p className="text-sm text-muted-foreground mt-2">{attachment.name}</p>
        </div>
      );
    }

    if (isPDF) {
      return (
        <div className="w-full h-[80vh]">
          <iframe
            src={fileUrl}
            className="w-full h-full border-0 rounded-lg"
            title={attachment.name}
            onError={() => setPreviewError(true)}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md border transition-colors hover:bg-accent/50",
          isCurrentUser ? "bg-white/10" : "bg-background",
          className
        )}
      >
        <FileIcon className="h-4 w-4 flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{attachment.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {formatFileSize(attachment.size)}
            </Badge>
            {attachment.type && (
              <Badge variant="outline" className="text-xs">
                {attachment.type.split("/")[1]?.toUpperCase() || "FILE"}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {canPreview && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handlePreview}
              title="Prévisualiser"
            >
              <Eye className="h-3 w-3" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleDownload}
            title="Télécharger"
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Dialog de prévisualisation */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 [&>button]:hidden">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <FileIcon className="h-5 w-5" />
                  {attachment.name}
                </DialogTitle>
                <DialogDescription>
                  {formatFileSize(attachment.size)} • {attachment.type}
                </DialogDescription>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openFileInNewTab(fileUrl)}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ouvrir
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(false)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Fermer
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-6">
            <ScrollArea className="h-[60vh]">
              {renderPreview()}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
