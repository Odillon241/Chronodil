import { ReactNode } from 'react';

export const metadata = {
  title: 'Profil | Chronodil',
  description: 'Gérez vos informations personnelles',
};

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
