import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readFile, stat } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    // Vérifier l'authentification
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { filename } = await params;
    
    // Sécuriser le nom de fichier (empêcher les attaques path traversal)
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return NextResponse.json({ error: "Nom de fichier invalide" }, { status: 400 });
    }

    const filePath = join(process.cwd(), "public", "uploads", "chat", filename);

    // Vérifier que le fichier existe
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "Fichier non trouvé" }, { status: 404 });
    }

    // Lire le fichier
    const fileBuffer = await readFile(filePath);
    const fileStats = await stat(filePath);

    // Déterminer le type MIME
    const extension = filename.split(".").pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      mp4: "video/mp4",
      webm: "video/webm",
      avi: "video/x-msvideo",
      mov: "video/quicktime",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      txt: "text/plain",
      zip: "application/zip",
      rar: "application/x-rar-compressed",
      "7z": "application/x-7z-compressed",
    };

    const mimeType = mimeTypes[extension || ""] || "application/octet-stream";

    // Créer la réponse avec les headers appropriés
    const response = new NextResponse(new Uint8Array(fileBuffer));
    response.headers.set("Content-Type", mimeType);
    response.headers.set("Content-Length", fileStats.size.toString());
    response.headers.set("Cache-Control", "public, max-age=31536000"); // Cache pendant 1 an
    response.headers.set("Content-Disposition", `inline; filename="${filename}"`);

    return response;
  } catch (error) {
    console.error("Erreur lors du téléchargement:", error);
    return NextResponse.json(
      { error: "Erreur lors du téléchargement du fichier" },
      { status: 500 }
    );
  }
}
