import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    const uploadDir = join(process.cwd(), "public", "uploads", "chat");
    
    // Créer le répertoire s'il n'existe pas
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uploadedFiles = [];

    for (const file of files) {
      // Vérifier la taille du fichier (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: `Le fichier ${file.name} est trop volumineux (max 10MB)` },
          { status: 400 }
        );
      }

      // Vérifier le type de fichier
      const allowedTypes = [
        "image/",
        "video/",
        "audio/",
        "application/pdf",
        "text/",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/zip",
        "application/x-rar-compressed",
        "application/x-7z-compressed",
      ];

      const isAllowed = allowedTypes.some(type => file.type.startsWith(type));
      if (!isAllowed) {
        return NextResponse.json(
          { error: `Type de fichier non autorisé: ${file.type}` },
          { status: 400 }
        );
      }

      // Générer un nom de fichier unique
      const fileExtension = file.name.split(".").pop();
      const uniqueId = nanoid();
      const fileName = `${uniqueId}.${fileExtension}`;
      const filePath = join(uploadDir, fileName);

      // Écrire le fichier
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Retourner les informations du fichier
      uploadedFiles.push({
        id: uniqueId,
        name: file.name,
        type: file.type,
        size: file.size,
        url: `/uploads/chat/${fileName}`,
        uploadedAt: new Date().toISOString(),
        uploadedBy: session.user.id,
      });
    }

    return NextResponse.json({ files: uploadedFiles });
  } catch (error) {
    console.error("Erreur lors de l'upload:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload des fichiers" },
      { status: 500 }
    );
  }
}
