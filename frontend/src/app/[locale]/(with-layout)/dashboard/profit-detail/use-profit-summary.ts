'use client';

import { useEffect, useState } from 'react';
import { ProfitSummaryResponseModel } from '@/types/data-model';
import useGetProfit from '@/hooks/dashboard/use-get-profit';

const useProfitSummary = (params: {
  from: string;
  to: string;
  clientId?: string;
}) => {
  const { getProfitSummary } = useGetProfit();
  const [data, setData] = useState<ProfitSummaryResponseModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { from, to, clientId } = params;

  useEffect(() => {
    setIsLoading(true);
    getProfitSummary({ from, to, clientId }).then((result) => {
      setData(result.success && result.data ? result.data : null);
      setIsLoading(false);
    });
  }, [getProfitSummary, from, to, clientId]);

  return { data, isLoading };
};

export default useProfitSummary;
