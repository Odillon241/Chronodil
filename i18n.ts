import { getRequestConfig } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';

export default getRequestConfig(async () => {
  // Récupérer la session et la langue de l'utilisateur
  let locale = 'fr'; // Langue par défaut

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { language: true },
      });

      if (user?.language) {
        locale = user.language;
      }
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de la langue:', error);
  }

  return {
    locale,
    messages: (await import(`./src/i18n/messages/${locale}.json`)).default,
  };
});

