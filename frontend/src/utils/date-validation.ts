/**
 * 생산 계획 폼 데이터의 날짜 유효성을 검사하는 유틸리티 함수
 */

interface DateFormDataModel {
  start_date: string;
  end_date: string;
}

/**
 * 날짜 유효성 검사
 * @param formData - 시작일과 종료일을 포함한 폼 데이터
 * @returns 유효한 날짜면 true, 그렇지 않으면 false
 */
export const checkDateValidity = (formData: DateFormDataModel): boolean => {
  // 날짜 형식 검증 (YYYY-MM-DD HH:mm)
  const dateRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

  if (!formData.start_date || !formData.end_date) {
    return false; // 빈 날짜
  }

  if (
    !dateRegex.test(formData.start_date) ||
    !dateRegex.test(formData.end_date)
  ) {
    return false; // 형식이 올바르지 않음
  }

  // Date 객체로 변환하여 유효한 날짜인지 확인
  const startDate = new Date(formData.start_date);
  const endDate = new Date(formData.end_date);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return false; // 유효하지 않은 날짜
  }

  // 시작일이 마감일보다 늦으면 안됨
  if (startDate >= endDate) {
    return false; // 시작일이 마감일과 같거나 늦음
  }

  return true; // 모든 검증 통과
};
