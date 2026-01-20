'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { signIn, signInWithGoogle } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { AuthLayout } from '@/components/auth/auth-layout'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // Afficher les erreurs de callback si présentes
    const error = searchParams.get('error')
    if (error) {
      toast.error(decodeURIComponent(error))
    }

    // Message de succès si confirmation email réussie
    const message = searchParams.get('message')
    if (message) {
      toast.success(decodeURIComponent(message))
    }
  }, [searchParams])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    try {
      const result = await signIn({
        email: data.email,
        password: data.password,
      })

      if (result.error) {
        // Messages d'erreur personnalisés en français
        let errorMessage = result.error.message || 'Échec de la connexion'

        if (errorMessage.includes('Invalid login credentials')) {
          errorMessage = 'Email ou mot de passe incorrect'
        } else if (errorMessage.includes('Email not confirmed')) {
          errorMessage =
            'Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte de réception.'
        } else if (errorMessage.includes('Too many requests')) {
          errorMessage = 'Trop de tentatives. Veuillez réessayer dans quelques minutes.'
        }

        toast.error(errorMessage)
      } else {
        toast.success('Connexion réussie !')
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error("Une erreur s'est produite lors de la connexion")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout title="Bienvenue" description="Connectez-vous pour accéder à votre espace">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              {...register('password')}
              disabled={isLoading}
              autoComplete="current-password"
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
          <Link
            href="/auth/forgot-password"
            className="text-xs text-primary hover:text-primary/80 font-medium transition-colors inline-block w-full text-right"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading} size="lg">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Spinner className="h-4 w-4" />
              Connexion...
            </span>
          ) : (
            'Se connecter'
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

        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={isLoading || isGoogleLoading}
          onClick={async () => {
            setIsGoogleLoading(true)
            try {
              const { error } = await signInWithGoogle()
              if (error) {
                toast.error('Erreur lors de la connexion avec Google')
              }
            } catch (error) {
              console.error('Google sign in error:', error)
              toast.error("Une erreur s'est produite")
            } finally {
              setIsGoogleLoading(false)
            }
          }}
        >
          {isGoogleLoading ? (
            <span className="flex items-center gap-2">
              <Spinner className="h-4 w-4" />
              Connexion...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuer avec Google
            </span>
          )}
        </Button>

        <div className="text-center text-sm">
          Vous n'avez pas de compte ?{' '}
          <Link
            href="/auth/register"
            className="text-primary hover:text-primary/80 font-medium transition-colors hover:underline"
          >
            S'inscrire
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  )
}
