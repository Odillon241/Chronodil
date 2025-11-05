import { ReactNode } from 'react';

export const metadata = {
  title: 'RH - Feuilles de temps | Chronodil',
  description: 'Vue RH des feuilles de temps de l\'équipe',
};

export default function HRTimesheetLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
