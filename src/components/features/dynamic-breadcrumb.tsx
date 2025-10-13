'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';

// Mapping des segments d'URL vers des labels en français
const segmentLabels: Record<string, string> = {
  dashboard: 'Tableau de bord',
  timesheet: 'Feuille de temps',
  'hr-timesheet': 'Activités RH',
  projects: 'Projets',
  tasks: 'Tâches',
  validation: 'Validation',
  reports: 'Rapports',
  settings: 'Paramètres',
  users: 'Utilisateurs',
  reminders: 'Rappels',
  chat: 'Chat',
};

export function DynamicBreadcrumb() {
  const pathname = usePathname();

  // Ne pas afficher sur la page de connexion
  if (!pathname.startsWith('/dashboard')) {
    return null;
  }

  // Séparer le pathname en segments
  const segments = pathname.split('/').filter(Boolean);

  // Si on est sur /dashboard seulement, afficher juste l'icône home
  if (segments.length === 1 && segments[0] === 'dashboard') {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>
              <Home className="h-4 w-4" />
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // Construire les breadcrumbs
  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label = segmentLabels[segment] || segment;
    const isLast = index === segments.length - 1;

    return {
      href,
      label,
      isLast,
      isFirst: index === 0,
    };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center gap-1.5">
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>
                  {crumb.isFirst ? (
                    <Home className="h-4 w-4" />
                  ) : (
                    crumb.label
                  )}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>
                    {crumb.isFirst ? (
                      <Home className="h-4 w-4" />
                    ) : (
                      crumb.label
                    )}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

