import { PrismaClient } from '@prisma/client'
import { hash } from '@node-rs/bcrypt'

const prisma = new PrismaClient()

async function fixAdminPassword() {
  console.log('🔐 Correction du hash du mot de passe admin...\n')

  try {
    // 1. Vérifier que l'utilisateur admin existe
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@chronodil.com' },
      include: { Account: true }
    })

    if (!admin) {
      console.error('❌ Utilisateur admin@chronodil.com introuvable')
      process.exit(1)
    }

    console.log(`✅ Utilisateur trouvé: ${admin.email} (ID: ${admin.id})`)

    // 2. Générer un nouveau hash avec @node-rs/bcrypt (utilisé par Better Auth)
    const newPassword = 'Admin2025@'
    const hashedPassword = await hash(newPassword, 10)

    console.log('✅ Nouveau hash généré')

    // 3. Mettre à jour ou créer le compte
    if (admin.Account.length > 0) {
      // Mettre à jour le compte existant
      await prisma.account.update({
        where: { id: admin.Account[0].id },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      })
      console.log('✅ Mot de passe mis à jour dans le compte existant')
    } else {
      // Créer un nouveau compte
      await prisma.account.create({
        data: {
          id: `account_${Date.now()}`,
          userId: admin.id,
          providerId: 'credential',
          accountId: admin.email,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
      console.log('✅ Nouveau compte créé avec le mot de passe hashé')
    }

    console.log('\n🎉 Mot de passe corrigé avec succès !')
    console.log('📧 Email: admin@chronodil.com')
    console.log('🔑 Mot de passe: Admin2025@')
    console.log('\n🚀 Vous pouvez maintenant vous connecter sur http://localhost:3000/auth/login')

  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixAdminPassword()
