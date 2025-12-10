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
