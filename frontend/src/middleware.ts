import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/config';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  
  // NEXT_LOCALE 쿠키를 세션 쿠키로 설정 (브라우저 종료 시 삭제)
  const localeCookie = response.cookies.get('NEXT_LOCALE') || request.cookies.get('NEXT_LOCALE');
  if (localeCookie) {
    // 기존 쿠키 삭제 후 세션 쿠키로 재설정
    response.cookies.delete('NEXT_LOCALE');
    // maxAge와 expires를 설정하지 않으면 세션 쿠키가 됨 (브라우저 종료 시 자동 삭제)
    response.cookies.set('NEXT_LOCALE', localeCookie.value, {
      sameSite: 'lax',
      path: '/',
      httpOnly: false,
      // maxAge와 expires를 명시적으로 설정하지 않음 → 세션 쿠키
    });
  }
  
  return response;
}

export const config = {
  // 모든 경로에서 언어 감지, 단 API와 정적 파일 제외
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};

