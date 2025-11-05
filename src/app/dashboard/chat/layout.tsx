import { ReactNode } from 'react';

export const metadata = {
  title: 'Messagerie | Chronodil',
  description: 'Communiquez avec votre équipe',
};

export default function ChatLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
