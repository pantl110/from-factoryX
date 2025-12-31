'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import useAuthStore from '@/store/auth-store';

const LocaleSync = () => {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();
  const { userInfo } = useAuthStore();

  useEffect(() => {
    if (!userInfo?.language) return;

    const userLocale = userInfo.language === 'korean' ? 'ko' : 'en';
    if (userLocale !== currentLocale) {
      router.replace(pathname, { locale: userLocale });
    }
  }, [userInfo?.language, currentLocale, pathname, router]);

  return null;
};

export default LocaleSync;
