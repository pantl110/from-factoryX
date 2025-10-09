import localFont from 'next/font/local';
import './globals.css';

const pretendard = localFont({
  src: [
    {
      path: '../assets/fonts/pretendard/Pretendard-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../assets/fonts/pretendard/Pretendard-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../assets/fonts/pretendard/Pretendard-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../assets/fonts/pretendard/Pretendard-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-pretendard',
  display: 'swap',
});

export const metadata = {
  title: 'Factory_X',
  description: 'Factory_X',
  icons: {
    icon: '/favicon.svg',
  },
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body
        className={`${pretendard.className} antialiased`}
        suppressHydrationWarning={process.env.NODE_ENV === 'development'}
      >
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
