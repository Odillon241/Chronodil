import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chronodil - Gestion des temps",
  description: "Application de gestion des feuilles de temps",
  icons: {
    icon: "/SVG/logo avec icône seulepapier_entête.svg",
    shortcut: "/SVG/logo avec icône seulepapier_entête.svg",
    apple: "/SVG/logo avec icône seulepapier_entête.svg",
  },
};

// ⚡ Next.js 16 + Cache Components
// Utilise un système i18n custom compatible avec Cache Components
// - Locale statique "fr" en SSR pour Cache Components
// - Le client détectera et mettra à jour la bonne locale
// - lib/i18n.ts: Charge les messages statiquement
// - NextIntlClientProvider: Pour les hooks client (useTranslations, etc.)

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Utiliser locale statique pour être compatible avec Cache Components
  // Le client se chargera de détecter la bonne locale
  const locale = 'fr' as const;
  const messages = await getMessages(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
