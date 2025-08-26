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
};

/**
 * 인증 관련 데이터만 정리하는 함수
 */
export const clearAuthData = () => {
  if (typeof window === 'undefined') return;

  // 인증 관련 localStorage 항목들 삭제
  localStorage.removeItem('auth-storage');
  localStorage.removeItem('member-storage');
};
