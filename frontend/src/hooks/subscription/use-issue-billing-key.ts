import { useState, useCallback } from 'react';
import axios from 'axios';
import {
  BillingKeyIssueRequestModel,
  BillingKeyIssueResponseModel,
} from '@/types/data-model';

// 빌링키 발급
export const useIssueBillingKey = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [billingKeyData, setBillingKeyData] =
    useState<BillingKeyIssueResponseModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  const issueBillingKey = useCallback(
    async (factoryId: number, payload: BillingKeyIssueRequestModel) => {
      if (!factoryId) {
        setError('공장 ID가 필요합니다.');
        return { success: false, error: '공장 ID가 필요합니다.' };
      }

      if (
        !payload.card_number ||
        !payload.card_expiry_year ||
        !payload.card_expiry_month ||
        !payload.card_password ||
        !payload.customer_identity_number
      ) {
        setError('모든 카드 정보를 입력해주세요.');
        return { success: false, error: '모든 카드 정보를 입력해주세요.' };
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/subscription/billing-key/${factoryId}`,
          payload,
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const result: BillingKeyIssueResponseModel = response.data;
        setBillingKeyData(result);
        return { success: true, data: result };
      } catch (err) {
        let errorMessage = '빌링키 발급에 실패했습니다.';

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
    },
    []
  );

  return { issueBillingKey, billingKeyData, isLoading, error };
};

export default useIssueBillingKey;
