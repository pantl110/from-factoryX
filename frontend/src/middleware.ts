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

// 이전 도메인(factoryx.work) -> 현재 도메인(pantl110.kr) 301 리다이렉트.
// Namecheap URL Forwarding이 443(HTTPS)을 서빙하지 못해, Railway가 발급한
// 인증서 위에서 앱 레벨로 처리한다. locale 처리보다 먼저 실행되어야 한다.
const LEGACY_HOSTS = ['factoryx.work', 'www.factoryx.work'];
const CANONICAL_ORIGIN = 'https://pantl110.kr';

export default function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0].toLowerCase();

  if (host && LEGACY_HOSTS.includes(host)) {
    const { pathname, search } = request.nextUrl;
    return NextResponse.redirect(`${CANONICAL_ORIGIN}${pathname}${search}`, 301);
  }

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
