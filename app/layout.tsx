import './globals.css';
import type { Metadata, Viewport } from 'next';
import { getLocale } from 'next-intl/server';
import { I18nProvider } from '@/components/I18nProvider';
import { isLocale, type Locale } from '@/i18n/config';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Mealprep',
  description: 'Plan your weeks, shop smart, cook efficiently.',
  manifest: '/manifest.webmanifest',
  applicationName: 'Mealprep',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mealprep',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#347637',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const serverLocale = await getLocale();
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get('mealprep.lang')?.value;
  const locale: Locale = isLocale(fromCookie) ? fromCookie : (serverLocale as Locale);

  return (
    <html lang={locale}>
      <body>
        <I18nProvider initialLocale={locale}>{children}</I18nProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
