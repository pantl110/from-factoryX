/**
 * 모든 스토리지와 쿠키를 정리하는 함수
 * 로그아웃, 회원 탈퇴 등에서 사용
 */
export const clearAllStorage = () => {
  if (typeof window === 'undefined') return;

  // localStorage 정리
  localStorage.clear();

  // sessionStorage 정리
  sessionStorage.clear();

  // 모든 쿠키 강제 삭제
  forceClearAllCookies();
};

/**
 * 모든 쿠키를 강제로 삭제하는 함수
 */
const forceClearAllCookies = () => {
  if (typeof window === 'undefined') return;

  // 현재 페이지의 모든 쿠키 가져오기
  const cookies = document.cookie.split(';');

  cookies.forEach((cookie) => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();

    // 중요한 쿠키들만 명시적으로 삭제
    if (
      name === 'access' ||
      name === 'refresh' ||
      name === 'access_token' ||
      name === 'refresh_token'
    ) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
    }
  });
};

/**
 * 특정 쿠키만 삭제하는 함수
 */
export const clearCookie = (name: string) => {
  if (typeof window === 'undefined') return;

  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
};

/**
 * 인증 관련 데이터만 정리하는 함수
 */
export const clearAuthData = () => {
  if (typeof window === 'undefined') return;

  // 인증 관련 localStorage 항목들만 삭제
  localStorage.removeItem('auth-storage');
  localStorage.removeItem('factory-storage');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');

  // 인증 관련 sessionStorage 항목들만 삭제
  sessionStorage.removeItem('auth-storage');
  sessionStorage.removeItem('factory-storage');

  // 인증 관련 쿠키들 삭제
  clearCookie('access');
  clearCookie('refresh');
  clearCookie('access_token');
  clearCookie('refresh_token');
};
