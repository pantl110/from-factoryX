'use client';

import { useState } from 'react';

// 공장 삭제
const useDeleteFactory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteFactory = async (factoryId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/factory?factory_id=${factoryId}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            factory_id: factoryId,
          }),
        }
      );
      if (response.status === 204) {
        return { success: true };
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '공장 삭제에 실패했습니다.');
        return { success: false, error: errorData.detail };
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return { success: false, error: '서버 연결에 실패했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteFactory, isLoading, error };
};

export default useDeleteFactory;
