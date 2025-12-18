import type { CollectionTermsType } from '@/types/status-type';

export const getDaysUntilPayment = (
  dateString: string | null
): string | null => {
  if (!dateString) return null;

  const today = new Date();
  const paymentDate = new Date(dateString);

  // 유효하지 않은 날짜인 경우 null 반환
  if (isNaN(paymentDate.getTime())) return null;

  const diffTime = paymentDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // NaN이거나 유효하지 않은 숫자인 경우 null 반환
  if (isNaN(diffDays) || !isFinite(diffDays)) return null;

  if (diffDays < 0) return `D+${Math.abs(diffDays)}`;
  return `D-${diffDays}`;
};

export const getAgreedPaymentDateByCollectionTerm = (
  term: CollectionTermsType,
  baseDateString: string | null
): string | null => {
  if (!baseDateString) return null;

  const baseDate = new Date(baseDateString);
  if (isNaN(baseDate.getTime())) return null;

  // "세금계산서 발행 후 30일 이내 입금"
  if (term === 'INVOICE_30') {
    baseDate.setDate(baseDate.getDate() + 30);
  }

  // "세금계산서 발행 익월 말일 입금"
  if (term === 'INVOICE_EOM_NEXT') {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    // 다음 달의 0일 → 해당 달의 마지막 날
    const endOfNextMonth = new Date(year, month + 2, 0);
    baseDate.setTime(endOfNextMonth.getTime());
  }

  // 다른 조건들은 아직 자동 계산 규칙이 없으므로 null 반환
  if (term !== 'INVOICE_30' && term !== 'INVOICE_EOM_NEXT') {
    return null;
  }

  return baseDate.toISOString().slice(0, 10); // YYYY-MM-DD
};
