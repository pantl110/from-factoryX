/**
 * 약정 입금일까지 남은/지난 일수를 계산하여 D-5 또는 D+5 형식으로 반환
 * @param dateString 약정 입금일 (ISO 형식 문자열 또는 null)
 * @returns D-5 (남은 일수) 또는 D+5 (지난 일수) 형식의 문자열, 날짜가 없거나 유효하지 않으면 null
 */
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
