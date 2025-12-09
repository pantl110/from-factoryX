import { QuotationProductResponseModel } from '@/types/data-model';
import { useQuery } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import useMemberStore from '@/store/member-store';

interface UseGetQuotationProductDetailReturnModel {
  data: QuotationProductResponseModel | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// 견적서 제품 상세 조회 // id는 quotation_product_id
const useGetQuotationProductDetail = (
  id: number
): UseGetQuotationProductDetailReturnModel => {
  const factoryId = useMemberStore((state) => state.factoryId);

  const { data, isLoading, error, refetch } = useQuery<
    QuotationProductResponseModel,
    AxiosError
  >({
    queryKey: ['quotation-product-detail', id, factoryId],
    queryFn: async () => {
      if (!factoryId) {
        throw new Error('공장 ID가 설정되지 않았습니다.');
      }

      const response = await axios.get<QuotationProductResponseModel>(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/document/quotation/product/${id}`,
        {
          params: {
            factory_id: factoryId,
          },
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    },
    enabled: !!id && id > 0 && !!factoryId,
  });

  const getErrorMessage = (): string | null => {
    if (!error) return null;

    const errorData = error.response?.data as { message?: string } | undefined;
    return (
      errorData?.message ||
      error.message ||
      '견적서 제품 상세 조회에 실패했습니다.'
    );
  };

  return {
    data: data || null,
    isLoading,
    error: getErrorMessage(),
    refetch: () => {
      refetch();
    },
  };
};

export default useGetQuotationProductDetail;
