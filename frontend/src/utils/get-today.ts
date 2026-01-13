/**
 * 오늘 날짜를 YYYY-MM-DD로 반환하는 함수
 * 브라우저의 로컬 시간대를 기준으로 날짜를 생성합니다
 * (사용자가 사용하는 시간대가 기준이 됩니다)
 *
 * @returns YYYY-MM-DD 형식의 오늘 날짜 문자열
 *
 * @example
 * getToday() // "2025-01-15" (사용자의 로컬 시간대 기준)
 */
export const getToday = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * 오늘 날짜를 UTC 기준으로 YYYY-MM-DD로 반환하는 함수
 * DB에 저장된 UTC datetime과 비교할 때 사용합니다
 *
 * @returns YYYY-MM-DD 형식의 오늘 날짜 문자열 (UTC 기준)
 *
 * @example
 * getTodayUTC() // "2025-01-15" (UTC 기준)
 */
export const getTodayUTC = () => {
  const today = new Date();
  const yyyy = today.getUTCFullYear();
  const mm = String(today.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(today.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * 날짜 문자열에 일수를 더하거나 빼는 함수
 * 브라우저의 로컬 시간대를 기준으로 계산합니다
 *
 * @param dateString - YYYY-MM-DD 형식의 날짜 문자열
 * @param days - 더하거나 빼고 싶은 일수 (음수 가능)
 * @returns YYYY-MM-DD 형식의 날짜 문자열
 *
 * @example
 * addDays('2025-01-15', 1) // "2025-01-16"
 * addDays('2025-01-15', -1) // "2025-01-14"
 */
export const addDays = (dateString: string, days: number): string => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * 두 날짜 사이의 일수 차이를 계산하는 함수
 * @param dateString1 - 비교할 첫 번째 날짜 (ISO 문자열 또는 Date 객체)
 * @param dateString2 - 비교할 두 번째 날짜 (ISO 문자열 또는 Date 객체, 기본값: 오늘)
 * @returns 일수 차이 (dateString1 - dateString2, 음수 가능)
 *
 * @example
 * getDaysDiff('2025-01-20', '2025-01-15') // 5
 * getDaysDiff('2025-01-15', '2025-01-20') // -5
 * getDaysDiff('2025-01-20') // 오늘부터의 일수 차이
 */
export const getDaysDiff = (
  dateString1: string | Date,
  dateString2?: string | Date
): number => {
  const date1 = new Date(dateString1);
  const date2 = dateString2 ? new Date(dateString2) : new Date();

  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
    return 0;
  }

  const diffTime = date1.getTime() - date2.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};
