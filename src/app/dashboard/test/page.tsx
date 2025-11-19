'use client';

import { NotificationComprehensiveTester } from '@/components/features/notification-comprehensive-tester';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function TestPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Test des Notifications</h1>
            <p className="text-muted-foreground mt-2">
              Suite de tests complète pour valider le système de notifications avec sons
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </div>

        {/* Testeur complet */}
        <NotificationComprehensiveTester />

        {/* Footer avec info */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            💡 <strong>Astuce:</strong> Ouvrez cette page dans plusieurs onglets et testez la
            synchronisation multi-onglets. Les sons doivent être synchronisés sans duplication.
          </p>
        </div>
      </div>
    </div>
  );
}
