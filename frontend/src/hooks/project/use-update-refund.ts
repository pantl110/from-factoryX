// import { useState, useCallback } from 'react';
// import useFactoryStore from '@/store/factory-store';
// import { UpdateRefundModel, UpdateRefundResponseModel } from '@/types/data-model';

// interface UpdateRefundParams {
//   refund_id: number;
//   payload: UpdateRefundModel;
// }

// const useUpdateRefund = () => {
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const { factoryId } = useFactoryStore();

//   const updateRefund = useCallback(async (params: UpdateRefundParams) => {
//     setIsLoading(true);
//     setError(null);

//     try {
//       if (!factoryId) {
//         setError('Factory ID를 찾을 수 없습니다.');
//         return { success: false, error: 'Factory ID를 찾을 수 없습니다.' };
//       }

//       const queryParams = new URLSearchParams();
//       queryParams.append('factory_id', factoryId.toString());

//       const response = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/v1/project/refund/${params.refund_id}?${queryParams}`,
//         {
//           method: 'PATCH',
//           credentials: 'include',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify(params.payload),
//         }
//       );

//       if (response.ok) {
//         const result: UpdateRefundResponseModel = await response.json();
//         return { success: true, data: result };
//       } else {
//         const errorData = await response.json();
//         const errorMessage = errorData.detail || '반품 수정에 실패했습니다.';
//         setError(errorMessage);
//         return { success: false, error: errorMessage };
//       }
//     } catch (error) {
//       const errorMessage = '서버 연결에 실패했습니다.';
//       setError(errorMessage);
//       return { success: false, error: errorMessage };
//     } finally {
//       setIsLoading(false);
//     }
//   }, [factoryId]);

//   return { updateRefund, isLoading, error };
// };

// export default useUpdateRefund;
