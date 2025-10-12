import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanBlobUrls() {
  console.log("🧹 Nettoyage des URLs blob dans les messages...");

  // Récupérer tous les messages (on filtrera ceux avec attachments après)
  const allMessages = await prisma.message.findMany();
  
  // Filtrer uniquement ceux avec des attachments
  const messages = allMessages.filter(m => m.attachments !== null && Array.isArray(m.attachments));

  console.log(`📊 ${messages.length} messages trouvés avec des attachments`);

  let cleaned = 0;
  let deleted = 0;

  for (const message of messages) {
    const attachments = message.attachments as any[];
    
    if (!Array.isArray(attachments)) {
      continue;
    }

    // Vérifier si des attachments ont des URLs blob
    const hasBlobUrls = attachments.some((att: any) => 
      att.url && typeof att.url === 'string' && att.url.startsWith('blob:')
    );

    if (hasBlobUrls) {
      console.log(`❌ Message ${message.id} contient des URLs blob`);
      
      // Option 1: Supprimer les attachments avec URLs blob
      const cleanedAttachments = attachments.filter((att: any) => 
        !att.url || !att.url.startsWith('blob:')
      );

      if (cleanedAttachments.length === 0) {
        // Si tous les attachments ont des URLs blob, supprimer le message
        await prisma.message.delete({
          where: { id: message.id },
        });
        deleted++;
        console.log(`  🗑️  Message supprimé (tous les attachments invalides)`);
      } else {
        // Sinon, mettre à jour avec les attachments valides
        await prisma.message.update({
          where: { id: message.id },
          data: {
            attachments: cleanedAttachments,
          },
        });
        cleaned++;
        console.log(`  ✅ Message nettoyé (${attachments.length - cleanedAttachments.length} attachment(s) supprimé(s))`);
      }
    }
  }

  console.log(`\n✨ Nettoyage terminé:`);
  console.log(`   - ${cleaned} message(s) nettoyé(s)`);
  console.log(`   - ${deleted} message(s) supprimé(s)`);
}

cleanBlobUrls()
  .then(() => {
    console.log("✅ Script terminé avec succès");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  });

