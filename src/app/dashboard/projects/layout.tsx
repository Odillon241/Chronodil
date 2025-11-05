import { ReactNode } from 'react';

export const metadata = {
  title: 'Projets | Chronodil',
  description: 'Gérez vos projets, équipes et ressources',
};

export default function ProjectsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
