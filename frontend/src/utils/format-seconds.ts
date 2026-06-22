export const formatSecondsToDuration = (
  seconds: number | null | undefined,
  t?: (key: string, values?: Record<string, string | number | Date>) => string
): string | null => {
  if (seconds === null || seconds === undefined || isNaN(Number(seconds))) {
    return null;
  }

  const totalSeconds = Math.round(Number(seconds));

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(t ? t('common.duration.hours', { n: hours }) : `${hours}시간`);
  }
  if (minutes > 0) {
    parts.push(
      t ? t('common.duration.minutes', { n: minutes }) : `${minutes}분`
    );
  }
  if (remainingSeconds > 0 || parts.length === 0) {
    parts.push(
      t
        ? t('common.duration.seconds', { n: remainingSeconds })
        : `${remainingSeconds}초`
    );
  }

  return parts.join(' ');
};
