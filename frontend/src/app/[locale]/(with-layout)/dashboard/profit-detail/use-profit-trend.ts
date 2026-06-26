'use client';

import { useEffect, useState } from 'react';
import { ProfitTrendResponseModel } from '@/types/data-model';
import useGetProfit from '@/hooks/dashboard/use-get-profit';

const useProfitTrend = (params: {
  from: string;
  to: string;
  clientId?: string;
}) => {
  const { getProfitTrend } = useGetProfit();
  const [data, setData] = useState<ProfitTrendResponseModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { from, to, clientId } = params;

  useEffect(() => {
    setIsLoading(true);
    getProfitTrend({ from, to, clientId }).then((result) => {
      setData(result.success && result.data ? result.data : null);
      setIsLoading(false);
    });
  }, [getProfitTrend, from, to, clientId]);

  return { data, isLoading };
};

export default useProfitTrend;
