import { ReactNode } from 'react';
import { TasksProviderWrapper } from '@/components/providers/tasks-provider-wrapper';

export const metadata = {
  title: 'Tâches | Chronodil',
  description: 'Gérez vos tâches et suivez l\'avancement de vos projets',
};

export default function TasksLayout({ children }: { children: ReactNode }) {
  return <TasksProviderWrapper>{children}</TasksProviderWrapper>;
}
