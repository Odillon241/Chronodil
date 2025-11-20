import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function restartServer() {
  try {
    console.log('🛑 Arrêt de tous les processus sur le port 3000...\n');

    // Trouver les processus sur le port 3000
    const { stdout } = await execAsync('netstat -ano | findstr :3000 | findstr LISTENING');

    // Extraire les PIDs
    const pids = stdout
      .split('\n')
      .map(line => {
        const match = line.trim().match(/\s+(\d+)\s*$/);
        return match ? match[1] : null;
      })
      .filter((pid, index, self) => pid && self.indexOf(pid) === index); // Unique PIDs

    if (pids.length === 0) {
      console.log('✅ Aucun processus trouvé sur le port 3000\n');
    } else {
      console.log(`📍 Processus trouvés: ${pids.join(', ')}\n`);

      // Tuer chaque processus
      for (const pid of pids) {
        try {
          await execAsync(`taskkill /F /PID ${pid}`);
          console.log(`  ✅ Processus ${pid} arrêté`);
        } catch (error) {
          console.log(`  ⚠️  Impossible d'arrêter le processus ${pid}`);
        }
      }
    }

    // Attendre 2 secondes
    console.log('\n⏳ Attente de 2 secondes...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Vérifier que le port est libéré
    try {
      const { stdout: check } = await execAsync('netstat -ano | findstr :3000 | findstr LISTENING');
      if (check.trim()) {
        console.log('❌ Le port 3000 est toujours occupé!\n');
        console.log(check);
      } else {
        console.log('✅ Le port 3000 est libre!\n');
      }
    } catch (error) {
      console.log('✅ Le port 3000 est libre!\n');
    }

    console.log('🚀 Démarrage du serveur Next.js...\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  IMPORTANT: Le serveur va se lancer dans un nouveau terminal');
    console.log('  Les variables d\'environnement seront rechargées depuis .env.local');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Lancer le serveur dans un nouveau processus détaché
    exec('pnpm dev', {
      detached: true,
      stdio: 'inherit'
    });

    console.log('✅ Serveur Next.js lancé avec succès!\n');
    console.log('📍 URL: http://localhost:3000');
    console.log('📧 Email: finaladmin@chronodil.com');
    console.log('🔑 Mot de passe: Admin2025!\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

restartServer();
