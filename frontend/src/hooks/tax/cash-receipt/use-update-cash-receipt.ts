'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { CashReceiptDetailResponseModel } from '@/types/data-model';

interface CashReceiptUpdatePayloadModel {
  is_hidden?: boolean;
}

interface UpdateCashReceiptParamsModel {
  cashReceiptId: number;
  payload: CashReceiptUpdatePayloadModel;
}

const useUpdateCashReceipt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cashReceiptId,
      payload,
    }: UpdateCashReceiptParamsModel) => {
      const response = await axios.patch<CashReceiptDetailResponseModel>(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/receipt/${cashReceiptId}`,
        payload,
        {
          withCredentials: true,
        }
      );

      return response.data;
    },
    onSuccess: (_data, variables) => {
      // 현금영수증 리스트 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['cash-receipts'],
      });
      // 현금영수증 상세 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['cash-receipt-detail', variables.cashReceiptId],
      });
    },
  });
};

export default useUpdateCashReceipt;
