'use client';

import { useState } from 'react';
import { getDefaultRange } from './utils';

const usePeriodRange = (initial?: { from: string; to: string }) => {
  const [from, setFrom] = useState(
    () => initial?.from ?? getDefaultRange().from
  );
  const [to, setTo] = useState(() => initial?.to ?? getDefaultRange().to);

  return {
    from,
    to,
    setFrom,
    setTo,
    period: { from, to, onFromChange: setFrom, onToChange: setTo },
  };
};

export default usePeriodRange;
