import { ReactNode } from 'react';

export const metadata = {
  title: 'Tâches | Chronodil',
  description: 'Gérez vos tâches et suivez l\'avancement de vos projets',
};

export default function TasksLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
