import { ReactNode } from 'react';

export const metadata = {
  title: 'Utilisateurs | Chronodil',
  description: 'Gérez les utilisateurs et les permissions',
};

export default function UsersLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
