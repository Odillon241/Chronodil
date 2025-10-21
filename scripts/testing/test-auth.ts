import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import * as crypto from "crypto";

const BASE_URL = process.env.BETTER_AUTH_URL || "http://localhost:3000";
const TEST_EMAIL = `test-${crypto.randomBytes(4).toString("hex")}@example.com`;
const TEST_PASSWORD = "TestPassword123!@#";

async function testDatabaseConnection() {
  console.log("🔍 Test 1: Connection à la base de données");
  try {
    const userCount = await prisma.user.count();
    console.log(`✅ Connexion DB réussie - ${userCount} utilisateurs en BD\n`);
    return true;
  } catch (error) {
    console.error("❌ Erreur connexion DB:", error);
    return false;
  }
}

async function testSignUp() {
  console.log(`🔍 Test 2: Inscription d'un nouvel utilisateur`);
  try {
    // Appel direct à Better Auth pour tester l'inscription
    const response = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: "Test User",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ Erreur inscription:", error);
      return false;
    }

    const data = await response.json();
    console.log(`✅ Inscription réussie - ID utilisateur: ${data.user?.id}\n`);
    return true;
  } catch (error) {
    console.error("❌ Erreur test inscription:", error);
    return false;
  }
}

async function testSignIn() {
  console.log(`🔍 Test 3: Connexion utilisateur`);
  try {
    const response = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ Erreur connexion:", error);
      return false;
    }

    const data = await response.json();
    const token = data.token;
    console.log(`✅ Connexion réussie - Token: ${token?.substring(0, 20)}...\n`);
    return token;
  } catch (error) {
    console.error("❌ Erreur test connexion:", error);
    return false;
  }
}

async function testSession(token: string) {
  console.log(`🔍 Test 4: Récupération de la session`);
  try {
    const response = await fetch(`${BASE_URL}/api/auth/get-session`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ Erreur récupération session:", error);
      return false;
    }

    const data = await response.json();
    console.log(`✅ Session récupérée - Email: ${data.session?.user?.email}\n`);
    return true;
  } catch (error) {
    console.error("❌ Erreur test session:", error);
    return false;
  }
}

async function testUserInDatabase() {
  console.log(`🔍 Test 5: Vérification de l'utilisateur en BD`);
  try {
    const user = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
    });

    if (!user) {
      console.error("❌ Utilisateur non trouvé en BD");
      return false;
    }

    console.log(`✅ Utilisateur trouvé en BD:`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Nom: ${user.name}`);
    console.log(`   - Rôle: ${user.role}\n`);
    return true;
  } catch (error) {
    console.error("❌ Erreur test DB:", error);
    return false;
  }
}

async function cleanupTestUser() {
  console.log(`🔍 Nettoyage: Suppression de l'utilisateur de test`);
  try {
    await prisma.user.deleteMany({
      where: { email: TEST_EMAIL },
    });
    console.log(`✅ Utilisateur supprimé\n`);
  } catch (error) {
    console.error("❌ Erreur nettoyage:", error);
  }
}

async function runAllTests() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("🚀 TESTS D'AUTHENTIFICATION - CHRONODIL APP");
  console.log("═══════════════════════════════════════════════════════════\n");

  const tests = [];

  // Test 1: Connexion DB
  const dbOk = await testDatabaseConnection();
  tests.push({ name: "Connexion BD", result: dbOk });

  if (!dbOk) {
    console.error("❌ Impossible de continuer - BD inaccessible");
    process.exit(1);
  }

  // Test 2: Inscription
  const signUpOk = await testSignUp();
  tests.push({ name: "Inscription", result: signUpOk });

  if (!signUpOk) {
    console.error("❌ Impossible de continuer - Inscription échouée");
    await cleanupTestUser();
    process.exit(1);
  }

  // Test 3: Connexion
  const token = await testSignIn();
  tests.push({ name: "Connexion", result: !!token });

  if (!token) {
    console.error("❌ Impossible de continuer - Connexion échouée");
    await cleanupTestUser();
    process.exit(1);
  }

  // Test 4: Session
  const sessionOk = await testSession(token);
  tests.push({ name: "Session", result: sessionOk });

  // Test 5: Utilisateur en BD
  const userInDbOk = await testUserInDatabase();
  tests.push({ name: "Utilisateur en BD", result: userInDbOk });

  // Résumé
  console.log("═══════════════════════════════════════════════════════════");
  console.log("📊 RÉSUMÉ DES TESTS");
  console.log("═══════════════════════════════════════════════════════════");
  tests.forEach((test) => {
    const icon = test.result ? "✅" : "❌";
    console.log(`${icon} ${test.name}`);
  });

  const passedTests = tests.filter((t) => t.result).length;
  console.log(`\n${passedTests}/${tests.length} tests réussis\n`);

  // Nettoyage
  await cleanupTestUser();
  await prisma.$disconnect();

  if (passedTests === tests.length) {
    console.log("✅ TOUS LES TESTS RÉUSSIS!");
    process.exit(0);
  } else {
    console.log("❌ CERTAINS TESTS ONT ÉCHOUÉ");
    process.exit(1);
  }
}

runAllTests().catch((error) => {
  console.error("Erreur critique:", error);
  process.exit(1);
});
