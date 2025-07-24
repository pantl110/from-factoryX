import { useState } from 'react';

interface UploadFileModel {
  file_name: string;
}

interface UploadFileUrlModel {
  upload_url: {
    url: string;
    fields: Record<string, string>;
  };
  object_url: string;
}

interface UploadResponseModel {
  success: boolean;
  object_url?: string;
  error?: string;
}

const useUploadFile = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File): Promise<UploadResponseModel> => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // 1. presigned URL 요청
      const presignedResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/aws/upload`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file_name: file.name,
          } as UploadFileModel),
        }
      );

      if (!presignedResponse.ok) {
        const errorData = await presignedResponse.json();
        throw new Error(errorData.detail || 'presigned URL 요청 실패');
      }

      const presignedData: UploadFileUrlModel = await presignedResponse.json();

      // 2. S3에 파일 업로드
      const formData = new FormData();

      // presigned URL의 fields를 FormData에 추가
      Object.entries(presignedData.upload_url.fields).forEach(
        ([key, value]) => {
          formData.append(key, value as string);
        }
      );

      // 파일을 마지막에 추가
      formData.append('file', file);

      const uploadResponse = await fetch(presignedData.upload_url.url, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('S3 파일 업로드 실패');
      }

      setUploadProgress(100);
      return {
        success: true,
        object_url: presignedData.object_url,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : '파일 업로드 중 오류가 발생했습니다.';
      setError(errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsUploading(false);
    }
  };

  const uploadMultipleFiles = async (
    files: File[]
  ): Promise<UploadResponseModel[]> => {
    const results: UploadResponseModel[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await uploadFile(file);
      results.push(result);

      // 전체 진행률 업데이트
      setUploadProgress(((i + 1) / files.length) * 100);
    }

    return results;
  };

  return {
    uploadFile,
    uploadMultipleFiles,
    isUploading,
    uploadProgress,
    error,
  };
};

export default useUploadFile;
