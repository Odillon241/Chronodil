"use server";

import { authActionClient } from "@/lib/safe-action";
import { z } from "zod";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { revalidatePath } from "next/cache";

// Action pour uploader un fichier d'avatar
export const uploadAvatar = authActionClient
  .schema(
    z.object({
      fileName: z.string(),
      fileContent: z.string(), // Base64 content
      fileType: z.string().regex(/^image\/(jpeg|jpg|png|gif|webp)$/),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { fileName, fileContent, fileType } = parsedInput;
    const { userId } = ctx;

    try {
      // Créer le dossier uploads s'il n'existe pas
      const uploadsDir = join(process.cwd(), "public", "uploads", "avatars");
      await mkdir(uploadsDir, { recursive: true });

      // Générer un nom de fichier unique
      const fileExtension = fileType.split("/")[1];
      const uniqueFileName = `${userId}-${Date.now()}.${fileExtension}`;
      const filePath = join(uploadsDir, uniqueFileName);

      // Convertir base64 en buffer et sauvegarder
      const base64Data = fileContent.replace(/^data:image\/[a-z]+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      
      await writeFile(filePath, buffer);

      // Retourner l'URL relative du fichier
      const fileUrl = `/uploads/avatars/${uniqueFileName}`;
      
      return { success: true, fileUrl };
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      throw new Error("Erreur lors de l'upload du fichier");
    }
  });
