import localFont from 'next/font/local';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import '../globals.css';
import QueryClientRootProvider from '@/providers/query-client';
import { routing } from '@/i18n/config';

const pretendard = localFont({
  src: [
    {
      path: '../../assets/fonts/pretendard/Pretendard-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../assets/fonts/pretendard/Pretendard-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../assets/fonts/pretendard/Pretendard-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../assets/fonts/pretendard/Pretendard-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-pretendard',
  display: 'swap',
});

export const metadata = {
  title: 'FactoryX',
  description: 'FactoryX',
  icons: {
    icon: '/favicon.svg',
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const LocaleLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) => {
  const { locale } = await params;

  // 지원하지 않는 언어인 경우 404
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={pretendard.variable}>
      <body
        className={`${pretendard.className} antialiased`}
        suppressHydrationWarning={process.env.NODE_ENV === 'development'}
      >
        <NextIntlClientProvider messages={messages}>
          <QueryClientRootProvider>{children}</QueryClientRootProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
};

export default LocaleLayout;
