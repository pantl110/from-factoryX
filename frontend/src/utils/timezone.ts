/**
 * UTC 시간을 브라우저 로컬 시간대로 변환하는 함수 (표시용만)
 * @param utcDateString - UTC 시간 문자열
 * @returns 로컬 시간으로 변환된 문자열 (YYYY-MM-DD HH:mm 형식)
 */
export const convertUTCToLocal = (utcDateString: string | null): string => {
  if (!utcDateString) return '';

  // ISO 형식(2025-08-24T04:13:00Z) 또는 일반 형식 모두 처리
  const date = new Date(utcDateString);

  // 유효한 날짜인지 확인
  if (isNaN(date.getTime())) return '';

  // 브라우저가 자동으로 로컬 시간대로 변환
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

/**
 * UTC 날짜를 브라우저 로컬 날짜로 변환하는 함수 (날짜만 표시)
 * @param utcDateString - UTC 시간 문자열
 * @returns 로컬 날짜로 변환된 문자열 (YYYY-MM-DD 형식)
 */
export const convertUTCToLocalDate = (utcDateString: string | null): string => {
  if (!utcDateString) return '';

  // ISO 형식(2025-08-24T04:13:00Z) 또는 일반 형식 모두 처리
  const date = new Date(utcDateString);

  // 유효한 날짜인지 확인
  if (isNaN(date.getTime())) return '';

  // 브라우저가 자동으로 로컬 시간대로 변환
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * UTC 시간을 브라우저 로컬 시간으로 변환하여 시간만 반환하는 함수
 * @param utcDateString - UTC 시간 문자열
 * @returns 로컬 시간으로 변환된 문자열 (HH:mm 형식)
 */
export const convertUTCToLocalTime = (utcDateString: string | null): string => {
  if (!utcDateString) return '-';

  // ISO 형식(2025-08-24T04:13:00Z) 또는 일반 형식 모두 처리
  const date = new Date(utcDateString);

  // 유효한 날짜인지 확인
  if (isNaN(date.getTime())) return '-';

  // 브라우저가 자동으로 로컬 시간대로 변환
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
};

/**
 * @deprecated convertUTCToLocal을 사용하세요
 * UTC 시간을 한국 시간(KST, +9시간)으로 변환하는 함수 (하위 호환성 유지)
 */
export const convertUTCToKST = convertUTCToLocal;

/**
 * @deprecated convertUTCToLocalDate를 사용하세요
 * UTC 날짜를 한국 날짜로 변환하는 함수 (하위 호환성 유지)
 */
export const convertUTCToKSTDate = convertUTCToLocalDate;

/**
 * @deprecated convertUTCToLocalTime을 사용하세요
 * UTC 시간을 한국 시간으로 변환하여 시간만 반환하는 함수 (하위 호환성 유지)
 */
export const convertUTCToKSTTime = convertUTCToLocalTime;
