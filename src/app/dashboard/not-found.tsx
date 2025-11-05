import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ArrowLeft, FileQuestion } from 'lucide-react';

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-8">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <FileQuestion className="h-16 w-16 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Page introuvable</CardTitle>
          <CardDescription>
            La ressource que vous recherchez n'existe pas ou vous n'avez pas les permissions nécessaires.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            <Link href="/dashboard" className="w-full">
              <Button className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Retour au tableau de bord
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Page précédente
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground text-center">
              Code d'erreur: 404 - Ressource non trouvée
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
