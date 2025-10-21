import { hash } from '@node-rs/bcrypt'

async function generateHash() {
  const password = 'Admin2025@'
  const rounds = 10
  
  console.log('🔐 Génération du hash bcrypt...\n')
  console.log(`Mot de passe: ${password}`)
  console.log(`Rounds: ${rounds}\n`)
  
  const hashedPassword = await hash(password, rounds)
  
  console.log('✅ Hash généré avec succès!\n')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('COPIEZ CE HASH:')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(hashedPassword)
  console.log('═══════════════════════════════════════════════════════════════\n')
  
  console.log('📝 Étapes suivantes:')
  console.log('1. Copiez le hash ci-dessus')
  console.log('2. Ouvrez FIX_ADMIN_PASSWORD.sql')
  console.log('3. Remplacez "$2a$10$YourBcryptHashWillBeHere" par le hash copié')
  console.log('4. Exécutez le script SQL dans Supabase Dashboard')
  console.log('\n🔗 Dashboard SQL Editor:')
  console.log('https://supabase.com/dashboard/project/ipghppjjhjbkhuqzqzyq/sql/new')
}

generateHash()

