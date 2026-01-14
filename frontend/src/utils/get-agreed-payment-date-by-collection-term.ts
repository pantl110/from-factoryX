import type { CollectionTermsType } from '@/types/status-type';

/**
 * 결제 조건에 따라 약정 입금일을 계산
 * @param term 결제 조건 (INVOICE_30, INVOICE_EOM_NEXT 등)
 * @param baseDateString 기준 날짜 (ISO 형식 문자열 또는 null)
 * @returns 계산된 약정 입금일 (YYYY-MM-DD 형식) 또는 null
 */
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
    const month = baseDate.getMonth(); // 0-11 (0=1월, 11=12월)

    // 익월(다음 달)의 마지막 날 계산
    // JavaScript Date에서 day=0은 전 달의 마지막 날을 의미
    // month + 2의 0일 = (month + 1) 달의 마지막 날
    // 예: 1월 15일 기준 → month=0 → new Date(2024, 2, 0) = 2024년 2월 29일 (윤년)
    // 예: 2월 15일 기준 → month=1 → new Date(2024, 3, 0) = 2024년 3월 31일
    const endOfNextMonth = new Date(year, month + 2, 0);

    // 년도가 넘어가는 경우 자동 처리됨 (예: 12월 → 다음 해 1월 말일)
    // 타임존 문제를 피하기 위해 로컬 날짜를 직접 포맷팅
    const resultYear = endOfNextMonth.getFullYear();
    const resultMonth = String(endOfNextMonth.getMonth() + 1).padStart(2, '0');
    const resultDate = String(endOfNextMonth.getDate()).padStart(2, '0');
    return `${resultYear}-${resultMonth}-${resultDate}`;
  }

  // INVOICE_30의 경우에도 타임존 문제를 피하기 위해 로컬 날짜 포맷팅
  if (term === 'INVOICE_30') {
    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, '0');
    const date = String(baseDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  }

  return null;
};
