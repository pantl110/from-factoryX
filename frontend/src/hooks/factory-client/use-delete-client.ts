import { useState } from 'react';
import { ClientDetailModel } from '@/types/data-model';

const useDeleteClient = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteClient = async (data: ClientDetailModel) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/client/clients/${data.client_id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );
      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '거래처 삭제에 실패했습니다.');
        return { success: false, error: errorData.detail };
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return { success: false, error: '서버 연결에 실패했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteClient, isLoading, error };
};

export default useDeleteClient;
