export const getRoleText = (role: string): string => {
  if (role === 'admin') return '시스템 관리자';
  if (role === 'manager') return '운영자';
  if (role === 'viewer') return '조회자';
  return '-';
};
