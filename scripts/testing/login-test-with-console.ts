import { chromium } from 'playwright';

async function login() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capturer TOUS les messages de console
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[BROWSER ${type.toUpperCase()}] ${text}`);
  });

  // Capturer les erreurs page
  page.on('pageerror', error => {
    console.log('[PAGE ERROR]', error.message);
  });

  // Capturer les réponses réseau
  page.on('response', async response => {
    const url = response.url();
    const status = response.status();

    // Log uniquement les requêtes API importantes
    if (url.includes('/api/auth') || url.includes('sign-in')) {
      console.log(`[NETWORK] ${status} ${url}`);

      // Si erreur, log le body de la réponse
      if (status >= 400) {
        try {
          const body = await response.text();
          console.log(`[RESPONSE ERROR] ${body}`);
        } catch (e) {
          // Ignorer si on ne peut pas lire le body
        }
      }
    }
  });

  try {
    console.log('🌐 Navigation vers la page de connexion...');
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle' });

    console.log('\n📝 Remplissage du formulaire...');
    await page.getByPlaceholder('nom@exemple.com').fill('finaladmin@chronodil.com');
    await page.locator('input[type="password"]').fill('Admin2025!');

    console.log('\n🔐 Tentative de connexion...');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    // Attendre soit une redirection, soit un message d'erreur
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log('\n📍 URL actuelle:', currentUrl);

    // Vérifier s'il y a des notifications d'erreur
    const toastError = await page.locator('[data-sonner-toast][data-type="error"]').textContent().catch(() => null);
    if (toastError) {
      console.log('🔴 Message d\'erreur affiché:', toastError);
    }

    // Vérifier s'il y a des erreurs de validation
    const validationErrors = await page.locator('.text-destructive').allTextContents();
    if (validationErrors.length > 0) {
      console.log('🔴 Erreurs de validation:', validationErrors);
    }

    if (currentUrl.includes('/dashboard')) {
      console.log('\n✅ CONNEXION RÉUSSIE !');
    } else {
      console.log('\n❌ CONNEXION ÉCHOUÉE - Reste sur la page de login');
    }

    // Garder le navigateur ouvert
    console.log('\n🕐 Navigateur restera ouvert pendant 2 minutes...');
    await page.waitForTimeout(120000);

  } catch (error) {
    console.error('\n❌ Erreur:', error);
  } finally {
    await browser.close();
  }
}

login();
