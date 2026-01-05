import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// 지원하는 언어 목록
export const locales = ['ko', 'en'] as const;
export type LocaleType = (typeof locales)[number];

// 기본 언어 (브라우저 언어가 한국어가 아닐 때 사용)
export const defaultLocale: LocaleType = 'en';

// 라우팅 설정
export const routing = {
  locales,
  defaultLocale,
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  // requestLocale이 없으면 기본 언어 사용
  let locale = await requestLocale;

  if (!locale || !locales.includes(locale as LocaleType)) {
    locale = defaultLocale;
  }

  // 정적 import로 변경 (Next.js 빌드 타임에 해결)
  let baseMessages;
  let withoutLayoutMessages;
  switch (locale) {
    case 'ko':
      baseMessages = (await import('../messages/ko.json')).default;
      withoutLayoutMessages = (
        await import('../messages/without-layout-ko.json')
      ).default;
      break;
    case 'en':
      baseMessages = (await import('../messages/en.json')).default;
      withoutLayoutMessages = (
        await import('../messages/without-layout-en.json')
      ).default;
      break;
    default:
      notFound();
  }

  // 메시지 병합
  const messages = {
    ...baseMessages,
    ...withoutLayoutMessages,
  };

  return {
    locale,
    messages,
  };
});
