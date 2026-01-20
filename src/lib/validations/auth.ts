import { z } from 'zod'
import { securePasswordSchema } from '@/lib/security'

/**
 * Schema de mot de passe pour la connexion
 * Note: On garde une validation minimale pour le login car le mot de passe
 * existant peut ne pas respecter les nouvelles regles de complexite
 */
const loginPasswordSchema = z.string().min(1, 'Le mot de passe est requis')

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: loginPasswordSchema,
})

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    email: z.string().email('Email invalide'),
    password: securePasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

export const resetPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
})

export const resetPasswordConfirmSchema = z
  .object({
    password: securePasswordSchema,
    confirmPassword: z.string(),
    token: z.string().min(1, 'Token requis'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type ResetPasswordConfirmInput = z.infer<typeof resetPasswordConfirmSchema>
