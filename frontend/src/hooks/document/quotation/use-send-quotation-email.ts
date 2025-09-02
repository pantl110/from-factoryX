import { useState } from 'react';
import useMemberStore from '@/store/member-store';

interface SendQuotationEmailPayloadModel {
  email: string;
  pdf_data?: string; // base64 string
}

interface SendQuotationEmailResponseModel {
  status: string;
  message: string;
}

interface UseSendQuotationEmailReturnModel {
  sendQuotationEmail: (
    quotationId: number,
    payload: SendQuotationEmailPayloadModel
  ) => Promise<SendQuotationEmailResponseModel>;
  isLoading: boolean;
  error: string | null;
}

// 견적서 첨부파일 이메일 전송 훅
const useSendQuotationEmail = (): UseSendQuotationEmailReturnModel => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const factoryId = useMemberStore((state) => state.factoryId);

  const sendQuotationEmail = async (
    quotationId: number,
    payload: SendQuotationEmailPayloadModel
  ): Promise<SendQuotationEmailResponseModel> => {
    setIsLoading(true);
    setError(null);

    if (!factoryId) {
      const errorMessage = '공장 ID가 설정되지 않았습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }

    if (!quotationId || quotationId <= 0) {
      const errorMessage = '유효하지 않은 견적서 ID입니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/document/quotation/${quotationId}/send-email?factory_id=${factoryId}`;

      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      if (response.ok) {
        return isJson
          ? ((await response.json()) as SendQuotationEmailResponseModel)
          : { status: 'success', message: '이메일이 전송되었습니다.' };
      } else {
        const errorData = isJson ? await response.json() : null;
        const errorMessage =
          errorData?.message ||
          errorData?.detail ||
          (response.status === 400
            ? '요청이 올바르지 않습니다.'
            : response.status === 403
              ? '이 견적서를 보낼 권한이 없습니다.'
              : response.status === 404
                ? '견적서 또는 파일을 찾을 수 없습니다.'
                : response.status === 500
                  ? '이메일 전송 중 서버 오류가 발생했습니다.'
                  : '이메일 전송에 실패했습니다.');
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '이메일 전송에 실패했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return { sendQuotationEmail, isLoading, error };
};

export default useSendQuotationEmail;
