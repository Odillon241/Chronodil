"use server";

import { authActionClient } from "@/lib/safe-action";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// Action pour uploader un fichier d'avatar vers Supabase Storage
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
      // Créer le client Supabase avec la service role key pour l'upload
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      // Générer un nom de fichier unique
      const fileExtension = fileType.split("/")[1];
      const uniqueFileName = `avatars/${userId}-${Date.now()}.${fileExtension}`;

      // Convertir base64 en buffer
      const base64Data = fileContent.replace(/^data:image\/[a-z]+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      // Supprimer l'ancien avatar s'il existe
      const { data: existingFiles } = await supabaseAdmin.storage
        .from("public")
        .list("avatars", { search: `${userId}-` });

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map((file) => `avatars/${file.name}`);
        await supabaseAdmin.storage.from("public").remove(filesToDelete);
      }

      // Upload vers Supabase Storage (bucket "public")
      const { data, error } = await supabaseAdmin.storage
        .from("public")
        .upload(uniqueFileName, buffer, {
          contentType: fileType,
          upsert: true,
        });

      if (error) {
        console.error("Erreur Supabase Storage:", error);
        throw new Error(`Erreur lors de l'upload: ${error.message}`);
      }

      // Construire l'URL publique
      const { data: publicUrl } = supabaseAdmin.storage
        .from("public")
        .getPublicUrl(uniqueFileName);

      return { success: true, fileUrl: publicUrl.publicUrl };
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      throw new Error("Erreur lors de l'upload du fichier");
    }
  });
