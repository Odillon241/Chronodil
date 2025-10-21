import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function testConnection() {
  console.log('🔍 Test de connexion Prisma...\n')

  try {
    // Test 1 : Compter les utilisateurs
    const userCount = await prisma.user.count()
    console.log(`✅ Nombre d'utilisateurs : ${userCount}`)

    // Test 2 : Trouver admin
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@chronodil.com' },
      include: { Account: true }
    })

    if (admin) {
      console.log('\n✅ Utilisateur admin trouvé :')
      console.log(`   ID: ${admin.id}`)
      console.log(`   Email: ${admin.email}`)
      console.log(`   Name: ${admin.name}`)
      console.log(`   Role: ${admin.role}`)
      console.log(`   Accounts: ${admin.Account.length}`)
      
      admin.Account.forEach((account, index) => {
        console.log(`\n   Account ${index + 1}:`)
        console.log(`     ID: ${account.id}`)
        console.log(`     Provider: ${account.providerId}`)
        console.log(`     AccountId: ${account.accountId}`)
        console.log(`     Has password: ${account.password ? 'YES' : 'NO'}`)
        console.log(`     Password length: ${account.password?.length || 0}`)
        console.log(`     Password start: ${account.password?.substring(0, 15)}`)
      })
    } else {
      console.log('\n❌ Utilisateur admin NON TROUVÉ')
    }

    // Test 3 : Chercher comme Better Auth le fait
    console.log('\n🔍 Recherche comme Better Auth (providerId="email")...')
    const account = await prisma.account.findFirst({
      where: {
        providerId: 'email',
        accountId: 'admin@chronodil.com'
      },
      include: {
        User: true
      }
    })

    if (account) {
      console.log('✅ Compte trouvé via Better Auth query:')
      console.log(`   Account ID: ${account.id}`)
      console.log(`   Provider: ${account.providerId}`)
      console.log(`   User Email: ${account.User.email}`)
      console.log(`   Password: ${account.password?.substring(0, 15)}...`)
    } else {
      console.log('❌ Compte NON TROUVÉ via Better Auth query')
    }

    // Test 4 : Lister TOUS les comptes
    console.log('\n📋 Liste de TOUS les comptes:')
    const allAccounts = await prisma.account.findMany({
      include: { User: true }
    })
    console.log(`Total: ${allAccounts.length} comptes`)
    allAccounts.forEach(acc => {
      console.log(`  - ${acc.User.email} | Provider: ${acc.providerId} | AccountId: ${acc.accountId}`)
    })

  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()

