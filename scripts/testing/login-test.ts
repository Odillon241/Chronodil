import { chromium } from 'playwright';

async function login() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🌐 Navigation vers la page de connexion...');
    await page.goto('http://localhost:3000/auth/login');

    console.log('📝 Remplissage du formulaire...');
    await page.getByPlaceholder('nom@exemple.com').fill('finaladmin@chronodil.com');
    await page.locator('input[type="password"]').fill('Admin2025!');

    console.log('🔐 Tentative de connexion...');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    // Attendre soit une redirection vers le dashboard, soit une erreur
    try {
      await page.waitForURL('**/dashboard**', { timeout: 5000 });
      console.log('✅ Connexion réussie!');
      console.log('📍 URL actuelle:', page.url());
    } catch (e) {
      console.log('⚠️ Pas de redirection vers le dashboard');
      console.log('📍 URL actuelle:', page.url());

      // Vérifier s'il y a des messages d'erreur
      const errorMessage = await page.locator('[role="alert"], .error, [data-error]').textContent().catch(() => null);
      if (errorMessage) {
        console.log('❌ Erreur:', errorMessage);
      }
    }

    // Garder le navigateur ouvert pendant 5 minutes
    console.log('🕐 Navigateur restera ouvert pendant 5 minutes...');
    await page.waitForTimeout(300000);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await browser.close();
  }
}

login();
