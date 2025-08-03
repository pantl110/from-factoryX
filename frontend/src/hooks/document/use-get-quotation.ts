import { QuotationResponseModel } from '@/types/data-model';
import { useState, useEffect } from 'react';

// 로컬스토리지에서 factoryId를 안전하게 가져오는 함수
const getStoredFactoryId = (): number | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('factoryId');
    return stored ? parseInt(stored, 10) : null;
  } catch {
    return null;
  }
};

interface UseGetDetailQuotationReturnModel {
  data: QuotationResponseModel | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// 견적서 ID로 견적서 상세 정보를 조회
const useGetDetailQuotation = (
  quotationId: number
): UseGetDetailQuotationReturnModel => {
  const [data, setData] = useState<QuotationResponseModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotation = async () => {
    setIsLoading(true);
    setError(null);

    const factoryId = getStoredFactoryId();
    if (!factoryId) {
      setError('공장 ID가 설정되지 않았습니다.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/document/quotation/${quotationId}?factory_id=${factoryId}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        const errorData = await response.json();
        
        // 백엔드 에러 코드에 따른 구체적인 메시지
        switch (response.status) {
          case 400:
            setError(errorData.detail || '잘못된 요청입니다.');
            break;
          case 403:
            setError('해당 견적서에 접근할 권한이 없습니다.');
            break;
          case 404:
            setError('견적서를 찾을 수 없습니다.');
            break;
          case 500:
            setError('서버 내부 오류가 발생했습니다.');
            break;
          default:
            setError(errorData.detail || '견적서 조회에 실패했습니다.');
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '네트워크 연결에 실패했습니다.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (quotationId && quotationId > 0) {
      fetchQuotation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotationId]);

  const refetch = () => {
    fetchQuotation();
  };

  return { data, isLoading, error, refetch };
};

export default useGetDetailQuotation;
