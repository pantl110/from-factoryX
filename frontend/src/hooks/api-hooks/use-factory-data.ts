// import { useState, useEffect } from "react";
// import {
//   FactoryDataModel,
//   FactoryApiResponse,
//   ApiPaginationInfo,
// } from "@/types/data-model";

// export const useFactoryData = () => {
//   const [data, setData] = useState<FactoryDataModel[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [pagination, setPagination] = useState<ApiPaginationInfo>({
//     count: 0,
//     totalCnt: 0,
//     pageCnt: 0,
//     curPage: 0,
//     nextPage: 0,
//     previousPage: 0,
//   });

//   useEffect(() => {
//     const fetchFactoryData = async () => {
//       try {
//         setLoading(true);
//         const response = await fetch("/api/factory");

//         if (!response.ok) {
//           throw new Error(`HTTP error! status: ${response.status}`);
//         }

//         // 응답이 JSON인지 확인
//         const contentType = response.headers.get("content-type");
//         if (!contentType || !contentType.includes("application/json")) {
//           throw new Error("API 응답이 JSON 형식이 아닙니다.");
//         }

//         const result: FactoryApiResponse = await response.json();
//         setData(result.data);
//         setPagination({
//           count: result.count,
//           totalCnt: result.totalCnt,
//           pageCnt: result.pageCnt,
//           curPage: result.curPage,
//           nextPage: result.nextPage,
//           previousPage: result.previousPage,
//         });
//       } catch (err) {
//         console.error("API Error:", err);
//         setError(
//           err instanceof Error ? err.message : "Failed to fetch factory data",
//         );
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchFactoryData();
//   }, []);

//   return { data, loading, error, pagination };
// };
