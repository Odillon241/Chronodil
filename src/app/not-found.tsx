import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Search } from 'lucide-react';

export const metadata = {
  title: 'Page introuvable | Chronodil',
  description: 'La page que vous recherchez n\'existe pas',
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        {/* 404 Icon */}
        <div className="relative">
          <h1 className="text-9xl font-bold text-muted-foreground/20">404</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <Search className="h-24 w-24 text-muted-foreground/40" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold">Page introuvable</h2>
          <p className="text-muted-foreground">
            Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link href="/dashboard">
            <Button className="w-full sm:w-auto">
              <Home className="mr-2 h-4 w-4" />
              Retour au tableau de bord
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.history.back()} className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Page précédente
          </Button>
        </div>

        {/* Help text */}
        <p className="text-sm text-muted-foreground pt-4">
          Besoin d'aide ? Contactez le support ou consultez notre documentation.
        </p>
      </div>
    </div>
  );
}
