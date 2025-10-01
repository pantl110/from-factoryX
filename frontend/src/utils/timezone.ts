/**
 * UTC 시간을 한국 시간(KST, +9시간)으로 변환하는 함수 (표시용만)
 * @param utcDateString - UTC 시간 문자열
 * @returns 한국 시간으로 변환된 문자열 (YYYY-MM-DD HH:mm 형식)
 */
export const convertUTCToKST = (utcDateString: string | null): string => {
  if (!utcDateString) return '';

  // ISO 형식(2025-08-24T04:13:00Z) 또는 일반 형식 모두 처리
  const utcDate = new Date(utcDateString);

  // 유효한 날짜인지 확인
  if (isNaN(utcDate.getTime())) return '';

  // 9시간(9 * 60 * 60 * 1000ms) 추가
  const kstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);

  // YYYY-MM-DD HH:mm 형식으로 반환
  return kstDate.toISOString().slice(0, 16).replace('T', ' ');
};

/**
 * UTC 날짜를 한국 날짜로 변환하는 함수 (날짜만 표시)
 * @param utcDateString - UTC 시간 문자열
 * @returns 한국 날짜로 변환된 문자열 (YYYY-MM-DD 형식)
 */
export const convertUTCToKSTDate = (utcDateString: string | null): string => {
  if (!utcDateString) return '';

  // ISO 형식(2025-08-24T04:13:00Z) 또는 일반 형식 모두 처리
  const utcDate = new Date(utcDateString);

  // 유효한 날짜인지 확인
  if (isNaN(utcDate.getTime())) return '';

  // 9시간(9 * 60 * 60 * 1000ms) 추가
  const kstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);

  // YYYY-MM-DD 형식으로 반환
  return kstDate.toISOString().slice(0, 10);
};
