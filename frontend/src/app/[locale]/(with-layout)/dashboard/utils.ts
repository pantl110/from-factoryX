export const gridLayout = [
  { i: 'summaryKpi', x: 0, y: 0, w: 1, h: 5, minW: 1, minH: 5 },
  { i: 'profitGraph', x: 1, y: 0, w: 3, h: 5, minW: 2, minH: 2 },
  {
    i: 'pendingQuote',
    x: 0,
    y: 5,
    w: 4,
    h: 2,
    minW: 2,
    minH: 2,
    maxH: 6,
  },
  { i: 'processProject', x: 0, y: 7, w: 4, h: 2, minW: 2, minH: 2, maxH: 6 },
  { i: 'todaySchedule', x: 0, y: 9, w: 4, h: 3, minW: 2, minH: 3 },
  { i: 'deliverySchedule', x: 0, y: 10, w: 4, h: 4, minW: 2, minH: 3 },
  { i: 'taxStatus', x: 0, y: 10, w: 2, h: 4, minW: 2, minH: 3 },
  { i: 'account', x: 2, y: 10, w: 2, h: 4, minW: 2, minH: 3 },
];

export const getVisibleItemCount = (
  width: number,
  height: number,
  options?: {
    minItemWidth?: number;
    minItemHeight?: number;
    gap?: number;
  }
) => {
  const minItemWidth = options?.minItemWidth ?? 240;
  const minItemHeight = options?.minItemHeight ?? 128;
  const gap = options?.gap ?? 8;

  const cols = Math.max(1, Math.floor((width + gap) / (minItemWidth + gap)));
  const rows = Math.max(1, Math.floor((height + gap) / (minItemHeight + gap)));

  return cols * rows;
};
