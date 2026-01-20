'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createSupabaseServerAdminClient } from '@/lib/supabase-admin'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

/**
 * Action serveur pour l'inscription
 */
export async function signUpAction(formData: { email: string; password: string; name: string }) {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        name: formData.name,
        role: 'EMPLOYEE',
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    console.error('[Auth Action] SignUp error:', error.message)
    return { error: error.message, success: false }
  }

  // Si l'utilisateur est créé dans Supabase Auth, créer aussi dans Prisma
  if (data.user) {
    try {
      // Vérifier si l'utilisateur existe déjà dans Prisma
      const existingUser = await prisma.user.findUnique({
        where: { email: formData.email },
      })

      if (!existingUser) {
        await prisma.user.create({
          data: {
            id: data.user.id, // Utiliser le même ID que Supabase Auth
            email: formData.email,
            name: formData.name,
            role: 'EMPLOYEE',
            emailVerified: false,
            updatedAt: new Date(),
          },
        })
        console.log('[Auth Action] User created in Prisma, userId:', data.user.id)
      }
    } catch (prismaError) {
      console.error('[Auth Action] Prisma error:', prismaError)
      // Ne pas bloquer si l'utilisateur Prisma échoue
    }
  }

  return {
    success: true,
    message: 'Inscription réussie ! Vérifiez votre email pour confirmer votre compte.',
    needsEmailConfirmation: !data.session, // Si pas de session, besoin de confirmer l'email
  }
}

/**
 * Action serveur pour la connexion
 */
export async function signInAction(formData: { email: string; password: string }) {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  })

  if (error) {
    console.error('[Auth Action] SignIn error:', error.message)

    // Messages d'erreur personnalisés en français
    let errorMessage = error.message
    if (error.message.includes('Invalid login credentials')) {
      errorMessage = 'Email ou mot de passe incorrect'
    } else if (error.message.includes('Email not confirmed')) {
      errorMessage = 'Veuillez confirmer votre email avant de vous connecter'
    }

    return { error: errorMessage, success: false }
  }

  // Si l'utilisateur existe dans Supabase Auth mais pas dans Prisma, le créer
  if (data.user) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { id: data.user.id },
      })

      if (!existingUser) {
        await prisma.user.create({
          data: {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
            role: data.user.user_metadata?.role || 'EMPLOYEE',
            emailVerified: !!data.user.email_confirmed_at,
            updatedAt: new Date(),
          },
        })
        console.log('[Auth Action] User synced to Prisma, userId:', data.user.id)
      }
    } catch (prismaError) {
      console.error('[Auth Action] Prisma sync error:', prismaError)
    }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

/**
 * Action serveur pour la déconnexion
 */
export async function signOutAction() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
}

/**
 * Action serveur pour demander la réinitialisation du mot de passe
 */
export async function requestPasswordResetAction(email: string) {
  // Vérifier d'abord si l'utilisateur existe dans Prisma
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  })

  if (!user) {
    return {
      error: "Aucun compte n'est associé à cet email",
      success: false,
    }
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`,
  })

  if (error) {
    console.error('[Auth Action] Password reset error:', error.message)
    return { error: error.message, success: false }
  }

  return {
    success: true,
    message: 'Un email de réinitialisation a été envoyé',
  }
}

/**
 * Action serveur pour mettre à jour le mot de passe
 */
export async function updatePasswordAction(newPassword: string) {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    console.error('[Auth Action] Update password error:', error.message)
    return { error: error.message, success: false }
  }

  return { success: true, message: 'Mot de passe mis à jour avec succès' }
}

/**
 * Action serveur admin pour créer un utilisateur (sans confirmation email)
 * À utiliser uniquement pour les administrateurs
 */
export async function adminCreateUserAction(userData: {
  email: string
  password: string
  name: string
  role?: string
}) {
  const supabaseAdmin = createSupabaseServerAdminClient()

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true, // Confirmer automatiquement l'email
    user_metadata: {
      name: userData.name,
      role: userData.role || 'EMPLOYEE',
    },
  })

  if (error) {
    console.error('[Admin Auth] Create user error:', error.message)
    return { error: error.message, success: false }
  }

  // Créer l'utilisateur dans Prisma
  if (data.user) {
    try {
      await prisma.user.create({
        data: {
          id: data.user.id,
          email: userData.email,
          name: userData.name,
          role: (userData.role as any) || 'EMPLOYEE',
          emailVerified: true,
          updatedAt: new Date(),
        },
      })
    } catch (prismaError) {
      console.error('[Admin Auth] Prisma error:', prismaError)
    }
  }

  return { success: true, user: data.user }
}

/**
 * Synchroniser un utilisateur Supabase Auth vers Prisma
 * Appelé après confirmation d'email ou connexion OAuth
 */
export async function syncUserToPrisma(_supabaseUserId: string) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    console.error('[Sync] Cannot get user:', error?.message)
    return { error: error?.message || 'User not found', success: false }
  }

  try {
    // Upsert - créer ou mettre à jour
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email!,
        name: user.user_metadata?.name || user.email!.split('@')[0],
        emailVerified: !!user.email_confirmed_at,
        updatedAt: new Date(),
      },
      create: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || user.email!.split('@')[0],
        role: user.user_metadata?.role || 'EMPLOYEE',
        emailVerified: !!user.email_confirmed_at,
        updatedAt: new Date(),
      },
    })

    return { success: true }
  } catch (prismaError) {
    console.error('[Sync] Prisma error:', prismaError)
    return { error: 'Database sync failed', success: false }
  }
}
