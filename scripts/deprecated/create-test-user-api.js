// Script pour créer un utilisateur de test via l'API Better Auth
async function createTestUser() {
  try {
    console.log("🔐 Création d'un utilisateur de test via Better Auth API...\n");

    const response = await fetch("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@chronodil.com",
        password: "Test2025!",
        name: "Test User",
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Utilisateur de test créé!");
      console.log("Résultat:", JSON.stringify(result, null, 2));
      console.log("\nMaintenant, vérifiez dans la base comment Better Auth a stocké le mot de passe.");
      console.log("Exécutez: node scripts/check-test-user.js");
    } else {
      console.log("❌ Erreur:", result);
    }

  } catch (error) {
    console.error("\n❌ Erreur:", error.message);
  }
}

createTestUser();
