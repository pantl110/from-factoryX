/**
 * 모든 스토리지를 정리하는 함수
 * 로그아웃, 회원 탈퇴 등에서 사용
 * 
 * 참고: 쿠키는 백엔드에서 세션 쿠키(expires=None)로 설정되어 있어
 * 브라우저를 닫을 때 자동으로 삭제됩니다.
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
  localStorage.removeItem('subscription-storage');
  // Toss Payments 식별자들도 함께 제거
  localStorage.removeItem('@tosspayments/client-id');
  localStorage.removeItem('@tosspayments/merchant-browser-id');
};
