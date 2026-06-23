'use client';

import { useEffect, useState } from 'react';
import { ProfitDetailResponseModel } from '@/types/data-model';
import useGetProfitDetail from '@/hooks/dashboard/use-get-profit-detail';
import { getDefaultRange } from './utils';

const useProfitRange = (initial?: { from: string; to: string }) => {
  const { getProfitDetail } = useGetProfitDetail();
  const [from, setFrom] = useState(
    () => initial?.from ?? getDefaultRange().from
  );
  const [to, setTo] = useState(() => initial?.to ?? getDefaultRange().to);
  const [data, setData] = useState<ProfitDetailResponseModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getProfitDetail({ from, to }).then((result) => {
      setData(result.success && result.data ? result.data : null);
      setIsLoading(false);
    });
  }, [getProfitDetail, from, to]);

  return {
    from,
    to,
    setFrom,
    setTo,
    data,
    isLoading,
    period: { from, to, onFromChange: setFrom, onToChange: setTo },
  };
};

export default useProfitRange;
