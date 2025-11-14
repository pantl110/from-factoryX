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

/**
 * UTC 시간을 한국 시간(KST, +9시간)으로 변환하여 시간만 반환하는 함수
 * @param utcDateString - UTC 시간 문자열
 * @returns 한국 시간으로 변환된 문자열 (HH:mm 형식)
 */
export const convertUTCToKSTTime = (utcDateString: string | null): string => {
  if (!utcDateString) return '-';

  // ISO 형식(2025-08-24T04:13:00Z) 또는 일반 형식 모두 처리
  const utcDate = new Date(utcDateString);

  // 유효한 날짜인지 확인
  if (isNaN(utcDate.getTime())) return '-';

  // UTC 시간에 9시간 추가 (UTC 기준으로 계산)
  const utcHours = utcDate.getUTCHours();
  const utcMinutes = utcDate.getUTCMinutes();

  // 9시간 추가
  let kstHours = utcHours + 9;
  if (kstHours >= 24) {
    kstHours = kstHours - 24;
  }

  const hours = kstHours.toString().padStart(2, '0');
  const minutes = utcMinutes.toString().padStart(2, '0');

  return `${hours}:${minutes}`;
};
