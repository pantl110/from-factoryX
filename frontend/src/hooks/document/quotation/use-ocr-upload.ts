import { useState } from 'react';
import useMemberStore from '@/store/member-store';
import { OcrDataModel } from '@/types/data-model';
import { useUploadFile } from '@/hooks';

interface OcrUploadModel {
  data: string; // base64 encoded file content
  document_type: 'quotation' | 'order';
}

interface OcrUploadResponseModel {
  status: string;
  message?: string;
  data?: OcrDataModel; // OCR 결과 데이터
  imageUrl?: string; // S3에 업로드된 원본 파일 URL (이미지 또는 PDF)
  thumbnailUrl?: string; // PDF 첫 페이지 썸네일 (data URL)
}

const useOcrUpload = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { factoryId } = useMemberStore();
  const { uploadFile } = useUploadFile();

  const uploadOcr = async (
    file: File,
    documentType: 'quotation' | 'order'
  ): Promise<OcrUploadResponseModel> => {
    setIsLoading(true);
    setError(null);

    if (!factoryId) {
      setError('공장 ID가 설정되지 않았습니다.');
      return { status: 'error', message: '공장 ID가 설정되지 않았습니다.' };
    }

    let imageUrl: string | undefined;

    try {
      // 1. 먼저 이미지를 S3에 업로드
      const uploadResult = await uploadFile(file);
      if (!uploadResult.success || !uploadResult.object_url) {
        throw new Error(uploadResult.error || '이미지 업로드에 실패했습니다.');
      }

      imageUrl = uploadResult.object_url;

      // 2. Convert file to base64 for OCR
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix (e.g., "data:application/pdf;base64,")
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const payload: OcrUploadModel = {
        data: base64Data,
        document_type: documentType,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/document/quotation/ocr?factory_id=${factoryId}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        const result: OcrDataModel = await response.json();

        const thumbnailUrl = result.thumbnail_image
          ? `data:image/png;base64,${result.thumbnail_image}`
          : undefined;

        // OCR API는 성공 시 직접 데이터를 반환
        // client_info와 request_items가 있으면 성공으로 간주
        if (result.client_info && result.request_items) {
          return {
            status: 'success',
            data: result,
            imageUrl,
            thumbnailUrl,
            message: 'OCR 처리에 성공했습니다.',
          };
        } else {
          // 예상한 데이터 구조가 아닌 경우
          return {
            status: 'error',
            message: 'OCR 결과 데이터 형식이 올바르지 않습니다.',
            imageUrl, // OCR 실패 시에도 업로드된 이미지 URL 포함
            thumbnailUrl,
          };
        }
      } else {
        let errorMessage = 'OCR 업로드에 실패했습니다.';
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // JSON 파싱 실패 시 기본 에러 메시지 사용
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'OCR 업로드에 실패했습니다.';
      setError(errorMessage);
      return {
        status: 'error',
        message: errorMessage,
        imageUrl, // OCR API 실패 시에도 S3 업로드된 이미지 URL 포함
      };
    } finally {
      setIsLoading(false);
    }
  };

  return { uploadOcr, isLoading, error };
};

export default useOcrUpload;
