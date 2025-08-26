import { useState } from 'react';
import {
  QuotationProductDeliveryUpdateModel,
  QuotationProductDeliveryUpdateResponseModel,
} from '@/types/data-model';
import useMemberStore from '@/store/member-store';

interface UpdateQuotationProductDeliveryResultModel {
  success: boolean;
  data?: QuotationProductDeliveryUpdateResponseModel;
  error?: string;
}

export const useUpdateQuotationProductDelivery = () => {
  const [isLoading, setIsLoading] = useState(false);
  const factoryId = useMemberStore((state) => state.factoryId);

  const updateQuotationProductDelivery = async (
    quotationProductId: number,
    payload: QuotationProductDeliveryUpdateModel
  ): Promise<UpdateQuotationProductDeliveryResultModel> => {
    if (!factoryId) {
      return {
        success: false,
        error: '공장 ID가 설정되지 않았습니다.',
      };
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/document/quotation/product/${quotationProductId}/delivery?factory_id=${factoryId}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        const result: QuotationProductDeliveryUpdateResponseModel =
          await response.json();
        return {
          success: true,
          data: result,
        };
      } else {
        const errorData = await response.json();
        const errorMessage =
          errorData.message || '납품 상태 수정에 실패했습니다.';

        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch {
      return {
        success: false,
        error: '납품 상태 수정 중 오류가 발생했습니다.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateQuotationProductDelivery,
    isLoading,
  };
};
