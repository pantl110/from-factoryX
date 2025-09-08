// 'use client';

// import { useState, useCallback } from 'react';
// import { SubscriptionListResponseModel } from '@/types/data-model';

// // 특정 공장의 구독 내역 조회
// const useGetSubscriptions = () => {
//   const [isLoading, setIsLoading] = useState(false);
//   const [subscriptionHistories, setSubscriptionHistories] = useState<SubscriptionListResponseModel | null>(null);
//   const [error, setError] = useState<string | null>(null);

//   const getSubscriptions = useCallback(async (factoryId: number, page: number = 1, pageSize: number = 5) => {
//     if (!factoryId) {
//       setError('공장 ID가 필요합니다.');
//       return { success: false, error: '공장 ID가 필요합니다.' };
//     }

//     setIsLoading(true);
//     setError(null);
    
//     try {
//       const queryParams = new URLSearchParams();
//       queryParams.append('page', page.toString());
//       queryParams.append('page_size', pageSize.toString());

//       const response = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/v1/subscription/${factoryId}?${queryParams}`,
//         {
//           method: 'GET',
//           credentials: 'include',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//         }
//       );

//       if (response.ok) {
//         const result: SubscriptionListResponseModel = await response.json();
//         setSubscriptionHistories(result);
//         return { success: true, data: result };
//       } else {
//         const errorData = await response.json();
//         const errorMessage = errorData.detail || '구독 내역을 불러오지 못했습니다.';
//         setError(errorMessage);
//         return { success: false, error: errorMessage };
//       }
//     } catch (err) {
//       console.error('Subscription histories fetch error:', err);
//       const errorMessage = '서버 연결에 실패했습니다.';
//       setError(errorMessage);
//       return { success: false, error: errorMessage };
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   return { getSubscriptions, subscriptionHistories, isLoading, error };
// };

// export default useGetSubscriptions;
