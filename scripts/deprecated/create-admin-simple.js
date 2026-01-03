// Script simple pour créer un admin en utilisant l'API Better Auth
const adminEmail = "admin@chronodil.com";
const adminPassword = "Admin2025!";

async function createAdmin() {
  console.log("🔐 Création du compte administrateur...");

  try {
    // Utiliser l'API Better Auth pour créer l'utilisateur
    const response = await fetch("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
        name: "Administrateur",
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ Erreur lors de la création:", result);
      return;
    }

    console.log("✅ Compte administrateur créé avec succès!");
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Mot de passe: ${adminPassword}`);
    console.log(`\n⚠️  IMPORTANT: Conservez ces identifiants en lieu sûr!`);
    console.log(`\n📝 NOTE: Vous devez maintenant définir le rôle ADMIN manuellement dans la base de données`);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  }
}

createAdmin();
