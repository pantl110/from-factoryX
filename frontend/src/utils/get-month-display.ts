/**
 * 월 숫자를 locale에 따라 표시 형식으로 변환하는 함수
 * 영어일 때는 월 이름(January, February 등), 한국어일 때는 숫자(1, 2 등)를 반환합니다
 *
 * @param month - 1-12 사이의 월 숫자
 * @param locale - 'ko' 또는 'en'
 * @returns locale에 따른 월 표시 문자열
 *
 * @example
 * getMonthDisplay(1, 'en') // "January"
 * getMonthDisplay(1, 'ko') // 1
 * getMonthDisplay(12, 'en') // "December"
 * getMonthDisplay(12, 'ko') // 12
 */
export const getMonthDisplay = (
  month: number,
  locale: string
): string | number => {
  if (locale === 'en') {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return monthNames[month - 1];
  }
  return month;
};
