'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import useAuthStore from '@/store/auth-store';

const LocaleSync = () => {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();
  const { userInfo } = useAuthStore();
  const isInitialLoad = useRef(true);
  const previousUserLanguage = useRef<string | undefined>(undefined);
  const hasSyncedAfterLogin = useRef(false);

  useEffect(() => {
    // 초기 로드 시에는 locale 변경하지 않음 (직접 URL 접근 허용)
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      previousUserLanguage.current = userInfo?.language;
      // 로그인 후 첫 동기화는 한 번만 수행
      if (userInfo?.language) {
        hasSyncedAfterLogin.current = false;
      }
      return;
    }

    if (!userInfo?.language) {
      previousUserLanguage.current = undefined;
      hasSyncedAfterLogin.current = false;
      return;
    }

    // userInfo.language를 locale로 변환 ('korean'/'english' 또는 'ko'/'en' 모두 처리)
    const languageMap: Record<string, string> = {
      korean: 'ko',
      english: 'en',
      ko: 'ko',
      en: 'en',
    };
    const userLocale = languageMap[userInfo.language] || 'ko';

    // userInfo.language가 실제로 변경되었을 때만 실행
    if (previousUserLanguage.current === userInfo.language) {
      // 로그인 후 첫 동기화가 아직 안 되었다면 한 번만 수행
      if (!hasSyncedAfterLogin.current) {
        if (userLocale !== currentLocale) {
          // 쿼리 파라미터 유지
          if (typeof window !== 'undefined') {
            const queryString = window.location.search;
            const newPath = queryString
              ? `${pathname}${queryString}`
              : pathname;
            router.replace(newPath, { locale: userLocale });
          } else {
            router.replace(pathname, { locale: userLocale });
          }
          hasSyncedAfterLogin.current = true;
        } else {
          hasSyncedAfterLogin.current = true;
        }
      }
      return;
    }

    // userInfo.language가 변경된 경우 (언어 설정에서 변경)
    previousUserLanguage.current = userInfo.language;
    hasSyncedAfterLogin.current = false;
    // currentLocale이 이미 userLocale과 같으면 변경하지 않음
    if (userLocale === currentLocale) {
      hasSyncedAfterLogin.current = true;
      return;
    }

    // 쿼리 파라미터 유지 (클라이언트 사이드에서만 작동)
    if (typeof window !== 'undefined') {
      const queryString = window.location.search;
      const newPath = queryString ? `${pathname}${queryString}` : pathname;
      router.replace(newPath, { locale: userLocale });
    } else {
      router.replace(pathname, { locale: userLocale });
    }
    hasSyncedAfterLogin.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo?.language, router]);

  return null;
};

export default LocaleSync;
