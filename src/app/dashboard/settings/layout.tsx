"use client";

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Settings,
  User,
  Users,
  Bell,
  Calendar,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/lib/auth-client';
import { Separator } from '@/components/ui/separator';

const settingsNavItems = [
  {
    title: 'Général',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Paramètres généraux de l\'application',
  },
  {
    title: 'Mon Profil',
    href: '/dashboard/settings/profile',
    icon: User,
    description: 'Informations personnelles',
  },
  {
    title: 'Notifications',
    href: '/dashboard/settings/notifications',
    icon: Bell,
    description: 'Préférences de notification',
  },
  {
    title: 'Rappels',
    href: '/dashboard/settings/reminders',
    icon: Calendar,
    description: 'Rappels de saisie de temps',
  },
  {
    title: 'Jours fériés',
    href: '/dashboard/settings/holidays',
    icon: Calendar,
    description: 'Gestion des jours fériés',
  },
  {
    title: 'Départements',
    href: '/dashboard/settings/departments',
    icon: Building2,
    description: 'Gestion des départements',
  },
  {
    title: 'Utilisateurs',
    href: '/dashboard/settings/users',
    icon: Users,
    description: 'Gestion des utilisateurs',
    roles: ['ADMIN', 'DIRECTEUR', 'HR'],
  },
] as const;

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;

  const visibleNavItems = settingsNavItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Navigation latérale */}
      <aside className="lg:w-64 shrink-0">
        <div className="sticky top-6 space-y-1">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-3 text-lg font-semibold tracking-tight">
              Paramètres
            </h2>
            <p className="px-3 text-sm text-muted-foreground">
              Configurez votre compte et vos préférences
            </p>
          </div>
          <Separator className="my-4" />
          <nav className="space-y-1 px-2">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard/settings' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{item.title}</div>
                    <div className={cn(
                      'text-xs truncate',
                      isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                    )}>
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
