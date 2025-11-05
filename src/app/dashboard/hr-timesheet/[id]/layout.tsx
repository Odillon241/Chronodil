import { ReactNode } from 'react';

export const metadata = {
  title: 'Détails feuille de temps | Chronodil',
  description: 'Détails et historique de la feuille de temps',
};

export default function HRTimesheetDetailLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
