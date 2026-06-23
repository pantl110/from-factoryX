export const formatMoney = (value: number) => value.toLocaleString('ko-KR');

export const formatRate = (rate: number) => `${rate.toFixed(1)}%`;

export const parseMonth = (month: string) => {
  const [year, m] = month.split('-');
  return { year, month: parseInt(m, 10) };
};
