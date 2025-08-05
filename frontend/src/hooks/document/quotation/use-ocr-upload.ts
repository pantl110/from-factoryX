import { useState } from 'react';

interface OcrUploadModel {
  data: string; // base64 encoded file content
}

interface OcrUploadResponseModel {
  status: string;
  message?: string;
}

const useOcrUpload = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadOcr = async (file: File): Promise<OcrUploadResponseModel> => {
    setIsLoading(true);
    setError(null);

    try {
      // Convert file to base64
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
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/document/quotation/ocr`,
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
        const result = await response.json();
        return result;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'OCR 업로드에 실패했습니다.');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'OCR 업로드에 실패했습니다.';
      setError(errorMessage);
      return { status: 'error', message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return { uploadOcr, isLoading, error };
};

export default useOcrUpload;
