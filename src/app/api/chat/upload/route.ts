import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { nanoid } from "nanoid";

const BUCKET_NAME = "chat-files";

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const uploadedFiles = [];

    for (const file of files) {
      // Vérifier la taille du fichier (max 50MB pour Supabase Storage)
      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json(
          { error: `Le fichier ${file.name} est trop volumineux (max 50MB)` },
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
      const fileName = `${session.user.id}/${uniqueId}.${fileExtension}`;
      const filePath = `chat/${fileName}`;

      // Convertir le File en ArrayBuffer puis en Blob
      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: file.type });

      // Uploader dans Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, blob, {
          contentType: file.type,
          upsert: false, // Ne pas remplacer si existe déjà
        });

      if (uploadError) {
        console.error("Erreur upload Supabase:", uploadError);
        return NextResponse.json(
          { error: `Erreur lors de l'upload: ${uploadError.message}` },
          { status: 500 }
        );
      }

      // Obtenir l'URL publique du fichier
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      // Retourner les informations du fichier
      uploadedFiles.push({
        id: uniqueId,
        name: file.name,
        type: file.type,
        size: file.size,
        url: urlData.publicUrl,
        path: filePath,
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
