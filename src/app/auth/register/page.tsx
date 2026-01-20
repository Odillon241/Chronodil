'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterInput } from '@/lib/validations/auth'
import { signUp } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { AuthLayout } from '@/components/auth/auth-layout'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

function SuccessState({ email }: { email: string }) {
  return (
    <AuthLayout title="Inscription réussie !" description="Votre compte a été créé">
      <div className="flex flex-col items-center space-y-6 text-center">
        <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-500" />
        </div>

        <Alert className="bg-muted/50 border-primary/20">
          <AlertTitle className="text-foreground">Compte créé avec succès</AlertTitle>
          <AlertDescription className="mt-2 text-muted-foreground">
            Un email de confirmation pourrait vous être envoyé à{' '}
            <span className="font-semibold text-foreground">{email}</span>.
          </AlertDescription>
        </Alert>

        <Link href="/auth/login" className="w-full">
          <Button className="w-full" size="lg">
            Se connecter maintenant
          </Button>
        </Link>
      </div>
    </AuthLayout>
  )
}

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true)
    try {
      const result = await signUp({
        email: data.email,
        password: data.password,
        name: data.name,
      })

      if (result.error) {
        let errorMessage = result.error.message || "Échec de l'inscription"

        if (errorMessage.includes('User already registered')) {
          errorMessage = 'Un compte existe déjà avec cet email. Essayez de vous connecter.'
        } else if (errorMessage.includes('Password should be at least')) {
          errorMessage = 'Le mot de passe doit contenir au moins 6 caractères'
        } else if (errorMessage.includes('Unable to validate email')) {
          errorMessage = 'Adresse email invalide'
        }

        toast.error(errorMessage)
      } else if (result.success) {
        setRegisteredEmail(data.email)
        setRegistrationSuccess(true)
        toast.success('Inscription réussie ! Vous pouvez maintenant vous connecter.')
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error("Une erreur s'est produite lors de l'inscription")
    } finally {
      setIsLoading(false)
    }
  }

  if (registrationSuccess) {
    return <SuccessState email={registeredEmail} />
  }

  return (
    <AuthLayout title="Créer un compte" description="Commencez à gérer votre temps efficacement">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom complet</Label>
          <Input
            id="name"
            type="text"
            placeholder="Jean Dupont"
            {...register('name')}
            disabled={isLoading}
            autoComplete="name"
            className="bg-transparent"
          />
          {errors.name && (
            <p className="text-sm text-destructive font-medium">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="nom@exemple.com"
            {...register('email')}
            disabled={isLoading}
            autoComplete="email"
            className="bg-transparent"
          />
          {errors.email && (
            <p className="text-sm text-destructive font-medium">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimum 8 caractères"
              {...register('password')}
              disabled={isLoading}
              autoComplete="new-password"
              className="bg-transparent pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive font-medium">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Répétez le mot de passe"
              {...register('confirmPassword')}
              disabled={isLoading}
              autoComplete="new-password"
              className="bg-transparent pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-destructive font-medium">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full mt-2" disabled={isLoading} size="lg">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Spinner className="h-4 w-4" />
              Inscription...
            </span>
          ) : (
            "S'inscrire"
          )}
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Ou</span>
          </div>
        </div>

        <div className="text-center text-sm">
          Vous avez déjà un compte ?{' '}
          <Link
            href="/auth/login"
            className="text-primary hover:text-primary/80 font-medium transition-colors hover:underline"
          >
            Se connecter
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
