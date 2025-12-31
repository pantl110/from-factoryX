import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// 지원하는 언어 목록
export const locales = ['ko', 'en'] as const;
export type LocaleType = (typeof locales)[number];

// 기본 언어
export const defaultLocale: LocaleType = 'ko';

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
  let messages;
  switch (locale) {
    case 'ko':
      messages = (await import('../messages/ko.json')).default;
      break;
    case 'en':
      messages = (await import('../messages/en.json')).default;
      break;
    default:
      notFound();
  }

  return {
    locale,
    messages,
  };
});
