import { useState, useEffect } from 'react';
import {
  EquipmentListResponseModel,
  EquipmentResponseModel,
} from '@/types/data-model';

const useGetEquipment = () => {
  const [equipmentList, setEquipmentList] =
    useState<EquipmentListResponseModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // 전체 설비 목록 불러오기
  const getEquipmentList = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/equipment`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );
      if (response.ok) {
        const result: EquipmentListResponseModel = await response.json();
        setEquipmentList(result);
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
  };

  // 검색어로 모든 필드 검색 (중복 제거)
  const searchAllFields = async (value: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const isNumber = !isNaN(Number(value)) && value.trim() !== '';
      const endpoints = [
        { qs: `name=${encodeURIComponent(value)}` },
        { qs: `status=${encodeURIComponent(value)}` },
        { qs: `location=${encodeURIComponent(value)}` },
        ...(isNumber ? [{ qs: `priority=${Number(value)}` }] : []),
      ];
      const fetches = endpoints.map(({ qs }) =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/factory/equipment?${qs}`, {
          method: 'GET',
          credentials: 'include',
        }).then(async (res) => {
          const data: EquipmentListResponseModel = await res.json();
          return res.ok
            ? data
            : {
                data: [],
                count: 0,
                totalCnt: 0,
                pageCnt: 1,
                curPage: 1,
                nextPage: 1,
                previousPage: 1,
              };
        })
      );
      const resultsArr = await Promise.all(fetches);
      // 모든 결과를 하나의 배열로 합치고 id 기준으로 중복 제거
      const allItems: EquipmentResponseModel[] = resultsArr.flatMap(
        (result: EquipmentListResponseModel) => {
          if (
            result &&
            typeof result === 'object' &&
            'data' in result &&
            Array.isArray(result.data)
          ) {
            return result.data;
          }
          return [];
        }
      );
      const uniqueMap = new Map<number, EquipmentResponseModel>();
      allItems.forEach((item) => {
        if (item && item.id !== undefined) {
          uniqueMap.set(item.id, item);
        }
      });
      const uniqueItems = Array.from(uniqueMap.values());
      // EquipmentListResponseModel 형태로 변환
      setEquipmentList({
        data: uniqueItems,
        count: uniqueItems.length,
        totalCnt: uniqueItems.length,
        pageCnt: 1,
        curPage: 1,
        nextPage: 1,
        previousPage: 1,
      });
    } catch {
      setError('서버 연결에 실패했습니다.');
      setEquipmentList(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 검색어가 바뀔 때마다 자동으로 fetch
  useEffect(() => {
    if (searchKeyword) {
      searchAllFields(searchKeyword);
    } else {
      getEquipmentList();
    }
  }, [searchKeyword]);

  return {
    equipmentList,
    isLoading,
    error,
    searchKeyword,
    setSearchKeyword,
    refetch: () =>
      searchKeyword ? searchAllFields(searchKeyword) : getEquipmentList(),
  };
};

export default useGetEquipment;
