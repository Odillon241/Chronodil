import { ReactNode } from 'react';

export const metadata = {
  title: 'Audit | Chronodil',
  description: 'Journal d\'audit et historique des actions',
};

export default function AuditLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
