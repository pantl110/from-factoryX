// 상대적 시간 포맷팅 함수
export const formatRelativeTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now.getTime() - date.getTime();
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

  // 어제인지 확인
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `어제 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  // 7일 이내
  if (diffInDays <= 7) {
    return `${diffInDays}일 전`;
  }

  // 7일 초과 ~ 올해 안
  const currentYear = now.getFullYear();
  if (date.getFullYear() === currentYear) {
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  }

  // 작년 이전
  return `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;
};
