// role을 한글로 변환
export const getRoleText = (role: string | null): string => {
  if (!role) return '-';
  if (role === 'admin') return '시스템 관리자';
  if (role === 'manager') return '운영자';
  if (role === 'viewer') return '조회자';
  if (role === 'prod_manager') return '생산관리자';
  return '-';
};
