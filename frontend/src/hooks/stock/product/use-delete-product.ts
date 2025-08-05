import { useState } from 'react';

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

const useDeleteProduct = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteProduct = async (productId: number) => {
    setIsLoading(true);
    setError(null);

    // 로컬스토리지에서 factoryId 가져오기
    const factoryId = getStoredFactoryId();
    if (!factoryId) {
      const errorMessage = '공장 ID가 설정되지 않았습니다.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/product/${productId}?factory_id=${factoryId}`;
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 204) {
        return { success: true };
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '품목 삭제에 실패했습니다.');
        return { success: false, error: errorData.detail };
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return { success: false, error: '서버 연결에 실패했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteProduct, isLoading, error };
};

export default useDeleteProduct;
