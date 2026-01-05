// role을 번역된 텍스트로 변환
export const getRoleText = (
  role: string | null,
  t?: (key: string) => string
): string => {
  if (!role) return '-';

  if (t) {
    const roleKey = role as 'admin' | 'manager' | 'prod_manager' | 'viewer';
    // t는 이미 네임스페이스를 포함하고 있으므로 roles.${roleKey}만 전달
    return t(`roles.${roleKey}`) || '-';
  }

  // fallback: 번역 함수가 없으면 한국어 반환
  if (role === 'admin') return '시스템 관리자';
  if (role === 'manager') return '운영자';
  if (role === 'viewer') return '조회자';
  if (role === 'prod_manager') return '생산관리자';
  return '-';
};
