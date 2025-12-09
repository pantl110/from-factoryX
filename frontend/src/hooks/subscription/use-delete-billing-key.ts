'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import useMemberStore from '@/store/member-store';

export interface BillingKeyDeleteResponseModel {
  success: boolean;
  message: string;
}

// 빌링키 삭제
export const useDeleteBillingKey = () => {
  const { factoryId } = useMemberStore();
  const [isLoading, setIsLoading] = useState(false);
  const [deleteResult, setDeleteResult] =
    useState<BillingKeyDeleteResponseModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  const deleteBillingKey = useCallback(async () => {
    if (!factoryId) {
      setError('공장 ID가 필요합니다.');
      return { success: false, error: '공장 ID가 필요합니다.' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/subscription/billing-key/${factoryId}`,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result: BillingKeyDeleteResponseModel = response.data;
      setDeleteResult(result);
      return { success: true, data: result };
    } catch (err) {
      let errorMessage = '빌링키 삭제에 실패했습니다.';

      if (axios.isAxiosError(err)) {
        if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [factoryId]);

  return { deleteBillingKey, deleteResult, isLoading, error };
};

export default useDeleteBillingKey;
