// 상대적 시간 포맷팅 함수 (상대적 시간은 UTC 기준, 절대 시간 표시는 한국 시간 기준)
export const formatRelativeTime = (dateString: string): string => {
  if (!dateString) return '';

  const now = new Date();
  const utcDate = new Date(dateString);

  // 유효한 날짜인지 확인
  if (isNaN(utcDate.getTime())) return '';

  // 상대적 시간 계산은 UTC 기준
  const diffInMs = now.getTime() - utcDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  // 1분 미만
  if (diffInMinutes < 1) {
    return '방금 전';
  }

  // 1시간 미만
  if (diffInHours < 1) {
    return `${diffInMinutes}분 전`;
  }

  // 24시간 미만
  if (diffInDays < 1) {
    return `${diffInHours}시간 전`;
  }

  // 절대 시간 표시는 한국 시간으로 변환
  const kstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);

  // 어제인지 확인 (한국 시간 기준)
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (kstDate.toDateString() === yesterday.toDateString()) {
    return `어제 ${kstDate.getHours().toString().padStart(2, '0')}:${kstDate.getMinutes().toString().padStart(2, '0')}`;
  }

  // 7일 이내
  if (diffInDays <= 7) {
    return `${diffInDays}일 전`;
  }

  // 7일 초과 ~ 올해 안 (한국 시간 기준)
  const currentYear = now.getFullYear();
  if (kstDate.getFullYear() === currentYear) {
    return `${kstDate.getMonth() + 1}월 ${kstDate.getDate()}일`;
  }

  // 작년 이전 (한국 시간 기준)
  return `${kstDate.getFullYear()}-${(kstDate.getMonth() + 1).toString().padStart(2, '0')}-${kstDate.getDate().toString().padStart(2, '0')}`;
};
