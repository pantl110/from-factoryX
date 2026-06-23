export const TABLE_PAGE_SIZE = 5;

export const formatMoney = (value: number) => value.toLocaleString('ko-KR');

export const formatRate = (rate: number) => `${rate.toFixed(1)}%`;

export const parseMonth = (month: string) => {
  const [year, m] = month.split('-');
  return { year, month: parseInt(m, 10) };
};

const toYearMonth = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

// 기본 기간: 올해 1월 ~ 올해 현재월
export const getDefaultRange = () => {
  const now = new Date();
  return { from: `${now.getFullYear()}-01`, to: toYearMonth(now) };
};

// 최근 N개월 기간 (현재월 포함)
export const getRecentRange = (months: number) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  return { from: toYearMonth(start), to: toYearMonth(now) };
};
