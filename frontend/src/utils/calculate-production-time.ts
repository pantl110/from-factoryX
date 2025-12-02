/**
 * 단위당 생산 시간을 계산합니다.
 * 계산식: (end_date - start_date) / quantity
 *
 * @param startDate - 생산 시작일 (ISO 문자열 또는 Date 객체)
 * @param endDate - 생산 종료일 (ISO 문자열 또는 Date 객체)
 * @param quantity - 생산 수량
 * @returns 계산된 단위당 시간 (초 단위, 반올림하여 정수로 반환), 계산 불가능한 경우 '-'
 */
export const calculateAvgProductionTime = (
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined,
  quantity: number | null | undefined
): string => {
  if (!startDate || !endDate || !quantity || quantity === 0) {
    return '-';
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // 유효한 날짜인지 확인
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return '-';
    }

    // 날짜 차이를 밀리초로 계산
    const diffInMs = Math.abs(end.getTime() - start.getTime());

    // 밀리초를 초로 변환하고 quantity로 나누기
    const diffInSeconds = diffInMs / 1000;
    const avgTime = diffInSeconds / quantity;

    // 반올림하여 정수로 변환
    return Math.round(avgTime).toString();
  } catch {
    return '-';
  }
};
