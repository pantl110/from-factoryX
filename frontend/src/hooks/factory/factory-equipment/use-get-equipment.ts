import { useState, useEffect, useCallback } from 'react';
import { EquipmentListResponseModel } from '@/types/data-model';
import useMemberStore from '@/store/member-store';

const useGetEquipment = () => {
  const [equipmentList, setEquipmentList] =
    useState<EquipmentListResponseModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // 페이지 사이즈를 10개로 고정
  const factoryId = useMemberStore((state) => state.factoryId);

  // 설비 목록 불러오기
  const getEquipmentList = useCallback(
    async (page: number = 1) => {
      setIsLoading(true);
      setError(null);

      if (!factoryId) {
        setError('공장 정보가 없습니다.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/equipment?factory_id=${factoryId}&page=${page}&page_size=${pageSize}`,
          {
            method: 'GET',
            credentials: 'include',
          }
        );
        if (response.ok) {
          const result: EquipmentListResponseModel = await response.json();
          setEquipmentList(result);
          setCurrentPage(page);
        } else {
          const errorData = await response.json();
          setError(errorData.detail || '설비 목록을 불러오지 못했습니다.');
          setEquipmentList(null);
        }
      } catch {
        setError('서버 연결에 실패했습니다.');
        setEquipmentList(null);
      } finally {
        setIsLoading(false);
      }
    },
    [factoryId, pageSize]
  );

  // 전체 설비 목록을 한 번에 가져오기 (totalCount 기반)
  const getAllEquipmentList = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!factoryId) {
      setError('공장 정보가 없습니다.');
      setIsLoading(false);
      return null;
    }

    try {
      // 먼저 전체 개수를 확인하기 위해 첫 페이지 요청
      const countResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/equipment?factory_id=${factoryId}&page=1&page_size=1`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (countResponse.ok) {
        const countResult: EquipmentListResponseModel =
          await countResponse.json();
        const totalCount = countResult.totalCnt || 0;

        if (totalCount > 0) {
          // 전체 데이터를 한 번에 가져오기
          const allDataResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/equipment?factory_id=${factoryId}&page=1&page_size=${totalCount}`,
            {
              method: 'GET',
              credentials: 'include',
            }
          );

          if (allDataResponse.ok) {
            const allDataResult: EquipmentListResponseModel =
              await allDataResponse.json();
            setEquipmentList(allDataResult);
            setCurrentPage(1);
            return allDataResult; // 데이터 반환
          } else {
            const errorData = await allDataResponse.json();
            setError(
              errorData.detail || '전체 설비 목록을 불러오지 못했습니다.'
            );
            return null;
          }
        } else {
          // 데이터가 없는 경우
          const emptyResult = {
            data: [],
            count: 0,
            totalCnt: 0,
            curPage: 1,
            pageCnt: 1,
          };
          setEquipmentList(emptyResult);
          return emptyResult; // 빈 데이터 반환
        }
      } else {
        const errorData = await countResponse.json();
        setError(errorData.detail || '설비 개수를 확인할 수 없습니다.');
        return null;
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [factoryId]);

  // 검색어로 설비 검색 (백엔드 페이지네이션 활용)
  const searchAllFields = useCallback(
    async (value: string, page: number = 1) => {
      setIsLoading(true);
      setError(null);

      if (!factoryId) {
        setError('공장 정보가 없습니다.');
        setIsLoading(false);
        return;
      }

      try {
        // 백엔드에서 검색과 페이지네이션을 모두 처리하도록 단일 API 호출
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/equipment?factory_id=${factoryId}&q=${encodeURIComponent(value)}&page=${page}&page_size=${pageSize}`,
          {
            method: 'GET',
            credentials: 'include',
          }
        );

        if (response.ok) {
          const result: EquipmentListResponseModel = await response.json();
          setEquipmentList(result);
          setCurrentPage(page);
        } else {
          const errorData = await response.json();
          setError(errorData.detail || '검색 결과를 불러오지 못했습니다.');
          setEquipmentList(null);
        }
      } catch {
        setError('서버 연결에 실패했습니다.');
        setEquipmentList(null);
      } finally {
        setIsLoading(false);
      }
    },
    [factoryId, pageSize]
  );

  // 검색어가 바뀔 때마다 자동으로 fetch
  useEffect(() => {
    if (searchKeyword) {
      searchAllFields(searchKeyword, 1); // 검색 시 첫 페이지로
    } else {
      getEquipmentList(1); // 검색어가 없을 때는 첫 페이지로
    }
  }, [searchKeyword, searchAllFields, getEquipmentList]);

  // 페이지 변경 함수
  const changePage = useCallback(
    async (page: number) => {
      if (searchKeyword) {
        // 검색 중일 때는 검색 결과에서 페이지네이션 처리
        await searchAllFields(searchKeyword, page);
      } else {
        await getEquipmentList(page);
      }
    },
    [searchKeyword, searchAllFields, getEquipmentList]
  );

  return {
    equipmentList,
    isLoading,
    error,
    searchKeyword,
    setSearchKeyword,
    currentPage,
    pageSize,
    changePage,
    getAllEquipmentList,
    refetch: useCallback(
      () =>
        searchKeyword ? searchAllFields(searchKeyword, 1) : getEquipmentList(1),
      [searchKeyword, searchAllFields, getEquipmentList]
    ),
  };
};

export default useGetEquipment;
