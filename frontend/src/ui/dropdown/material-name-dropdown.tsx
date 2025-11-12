import { MaterialResponseModel } from '@/types/data-model';
import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';
import { useState, useEffect, useCallback } from 'react';
import useGetMaterial from '@/hooks/stock/material/use-get-material';

interface MaterialNameDropdownProps {
  searchTerm: string;
  onSelect: (item: MaterialResponseModel) => void;
  onClose: () => void;
  width?: string;
}

export const MaterialNameDropdown = ({
  searchTerm,
  onSelect,
  onClose,
  width,
}: MaterialNameDropdownProps) => {
  const [materials, setMaterials] = useState<MaterialResponseModel[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { getMaterialList } = useGetMaterial();

  // 초기 데이터 로드
  useEffect(() => {
    const abortController = new AbortController();
    let isCurrentRequest = true;

    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const response = await getMaterialList({
          q: searchTerm,
          page: 1,
          page_size: 5,
        });

        // 컴포넌트가 언마운트되었거나 새로운 요청이 시작된 경우 무시
        if (!isCurrentRequest) {
          return;
        }

        const newMaterials = response?.data?.data || [];
        const nextPage =
          response?.data && 'nextPage' in response.data
            ? response.data.nextPage
            : null;

        setMaterials(newMaterials);
        setCurrentPage(1);
        setHasMore(!!nextPage);
      } catch (error) {
        if (!isCurrentRequest) {
          return;
        }
        console.error('Failed to fetch materials:', error);
      } finally {
        if (isCurrentRequest) {
          setIsLoading(false);
        }
      }
    };

    if (searchTerm) {
      fetchInitialData();
    }

    // cleanup: 새로운 요청이 시작되거나 컴포넌트가 언마운트되면 이전 요청 무시
    return () => {
      isCurrentRequest = false;
      abortController.abort();
    };
  }, [searchTerm, getMaterialList]);

  // 더 많은 자재 로드
  const loadMoreMaterials = useCallback(async () => {
    if (isLoading || !hasMore) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await getMaterialList({
        q: searchTerm,
        page: currentPage + 1,
        page_size: 5,
      });
      const newMaterials = response?.data?.data || [];
      const nextPage =
        response?.data && 'nextPage' in response.data
          ? response.data.nextPage
          : null;

      setMaterials((prev) => [...prev, ...newMaterials]);
      setCurrentPage((prev) => prev + 1);
      setHasMore(!!nextPage);
    } catch (error) {
      console.error('Failed to load more materials:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, searchTerm, currentPage, getMaterialList]);

  // 검색 결과가 없으면 드롭다운 표시 안 함
  if (materials.length === 0) {
    return null;
  }

  return (
    <Dropdown
      onClose={onClose}
      width={width}
      maxHeight="max-h-[180px]"
      onLoadMore={loadMoreMaterials}
      hasMore={hasMore}
      isLoading={isLoading}
    >
      {materials.map((item, index) => (
        <DropdownItem
          key={`${item.code}-${index}`}
          text={item.name}
          onClick={() => onSelect(item)}
          search={true}
        />
      ))}
    </Dropdown>
  );
};
