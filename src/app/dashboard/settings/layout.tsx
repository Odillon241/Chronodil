import { ReactNode } from 'react';

export const metadata = {
  title: 'Paramètres | Chronodil',
  description: 'Configurez votre compte et vos préférences',
};

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
