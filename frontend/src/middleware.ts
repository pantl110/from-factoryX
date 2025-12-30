import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/config';

// 쿠키를 사용하지 않고 URL 기반으로만 locale 관리
const intlMiddleware = createMiddleware({
  ...routing,
  // localeDetection을 false로 설정하여 쿠키 사용 비활성화
  localeDetection: false,
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
      headers: headers,
    });
  }
  
  return response;
}

export const config = {
  // 모든 경로에서 언어 감지, 단 API와 정적 파일 제외
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};

