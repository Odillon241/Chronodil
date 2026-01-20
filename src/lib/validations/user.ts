import { z } from 'zod'
import { securePasswordSchema } from '@/lib/security'

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
  email: z.string().email('Email invalide'),
  avatar: z.string().url('URL invalide').optional().or(z.literal('')),
  position: z
    .string()
    .max(100, 'Le poste ne doit pas dépasser 100 caractères')
    .optional()
    .or(z.literal('')),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
    newPassword: securePasswordSchema,
    confirmPassword: z.string().min(1, 'La confirmation du mot de passe est requise'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
