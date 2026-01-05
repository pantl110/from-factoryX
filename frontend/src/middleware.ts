import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/config';

// 브라우저 언어 감지 활성화 (한국어일 때만 'ko', 그 외에는 'en')
const intlMiddleware = createMiddleware({
  ...routing,
  // 브라우저 언어 자동 감지 활성화
  localeDetection: true,
  // 기본값을 'en'으로 설정 (한국어가 아닐 때)
  defaultLocale: 'en',
});

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  // 혹시 모를 NEXT_LOCALE 쿠키 완전히 제거
  // URL 기반으로만 locale 관리
  const headers = new Headers(response.headers);
  const setCookieHeaders = headers.getSetCookie();

  // NEXT_LOCALE 쿠키가 있으면 제거
  if (setCookieHeaders.some((cookie) => cookie.startsWith('NEXT_LOCALE='))) {
    headers.delete('Set-Cookie');
    setCookieHeaders.forEach((cookie) => {
      if (!cookie.startsWith('NEXT_LOCALE=')) {
        headers.append('Set-Cookie', cookie);
      }
    });

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return response;
}

export const config = {
  // 모든 경로에서 언어 감지, 단 API와 정적 파일 제외
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
