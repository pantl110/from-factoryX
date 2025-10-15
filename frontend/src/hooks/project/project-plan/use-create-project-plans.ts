// import { useState } from 'react';
// import {
//   ProjectPlanResponseModel,
//   CreateProjectPlanModel,
// } from '@/types/data-model';

// interface CreateProjectPlansResponseModel {
//   message: string;
//   created_plans: ProjectPlanResponseModel[];
// }

// // 각 견적서 제품에 대해 최대 2개의 생산 계획을 생성
// // 첫 번째 계획: 사용자가 지정한 생산 수량
// // 두 번째 계획: 남은 수량 (있는 경우에만)
// // 설비: 기본값 첫번째계획과 동일 설비, 다른 설비로 설정 가능
// // 생산일정: 기본값 첫번째계획과 동일 일정, 일정 변경 불가
// // => 설비는 분산하되, 일정은 동일하게 하여 병렬 생산

// // 예시
// // {
// //   "project_id": 123,
// //   "quotation_product_ids": [1, 2],
// //   "production_quantities": [80, 150],    // 사용자가 지정한 생산 수량
// //   "equipment_ids": [1, 2],
// //   "start_dates": ["2024-01-01", "2024-01-02"],
// //   "end_dates": ["2024-01-10", "2024-01-12"],
// //   "avg_production_times": [60, 90]
// // }
// // - 견적서 제품 정보
// //   - 제품 1: 총 수량 100개
// //   - 제품 2: 총 수량 200개
// // - 생성되는 생산 계획
// //   - 제품 1 - 계획 1: 80개 (사용자 지정)
// //   -       - 계획 2: 20개 (자동 계산: 100 - 80)
// //   - 제품 2 - 계획 1: 150개 (사용자 지정)
// //   -       - 계획 2: 50개 (자동 계산: 200 - 150)

// const useCreateProjectPlans = () => {
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const createProjectPlans = async (data: CreateProjectPlanModel) => {
//     setIsLoading(true);
//     setError(null);

//     try {
//       const response = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/v1/project-plan`,
//         {
//           method: 'POST',
//           credentials: 'include',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify(data),
//         }
//       );
//       if (response.status === 200) {
//         const result: CreateProjectPlansResponseModel = await response.json();
//         return { success: true, data: result };
//       } else {
//         const errorData = await response.json();
//         setError(errorData.detail || '프로젝트 계획 생성에 실패했습니다.');
//         return { success: false, error: errorData.detail };
//       }
//     } catch {
//       setError('서버 연결에 실패했습니다.');
//       return { success: false, error: '서버 연결에 실패했습니다.' };
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return { createProjectPlans, isLoading, error };
// };

// export default useCreateProjectPlans;
