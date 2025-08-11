// import { useState, useCallback } from 'react';
// import { ProjectPlanModel } from '@/types/data-model';

// interface ProjectPlanListFilter {
//   project_name?: string;
// }

// // 완료된 프로젝트의 생산 계획을 조회합니다. 프로젝트 이름으로 검색 가능합니다.
// const useGetCompletedProjectPlans = () => {
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const getCompletedProjectPlans = useCallback(async (filters: ProjectPlanListFilter = {}) => {
//     setIsLoading(true);
//     setError(null);

//     try {
//       // localStorage에서 factoryId 가져오기
//       const factoryId = localStorage.getItem('factoryId');
//       if (!factoryId) {
//         throw new Error('공장 정보가 없습니다.');
//       }

//       // 쿼리 파라미터 구성
//       const params = new URLSearchParams({
//         factory_id: factoryId,
//         ...filters,
//       });

//       const response = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/v1/project/plan/completed?${params}`,
//         {
//           method: 'GET',
//           credentials: 'include',
//         }
//       );

//       if (response.ok) {
//         const result: ProjectPlanModel[] = await response.json();
//         return { success: true, data: result };
//       } else {
//         const errorData = await response.json();

//         switch (response.status) {
//           case 404:
//             setError('완료된 프로젝트에 생성된 생산 계획이 없습니다.');
//             break;
//           case 500:
//             setError('서버 내부 오류가 발생했습니다.');
//             break;
//           default:
//             setError(errorData.detail || '완료된 프로젝트 계획 조회에 실패했습니다.');
//         }
//         return { success: false, error: errorData.detail };
//       }
//     } catch (err) {
//       const errorMessage =
//         err instanceof Error ? err.message : '서버 연결에 실패했습니다.';
//       setError(errorMessage);
//       return { success: false, error: errorMessage };
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   return { getCompletedProjectPlans, isLoading, error };
// };

// export default useGetCompletedProjectPlans;
