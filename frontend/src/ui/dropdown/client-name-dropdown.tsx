'use client';

import { ClientResponseModel } from '@/types/data-model';
import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';
import { useState, useEffect, useCallback } from 'react';
import useGetClient from '@/hooks/factory/factory-client/use-get-client';

interface ClientNameDropdownProps {
  searchTerm: string;
  onSelect: (item: ClientResponseModel) => void;
  onClose: () => void;
  width?: string;
  style?: React.CSSProperties;
}

export const ClientNameDropdown = ({
  searchTerm,
  onSelect,
  onClose,
  width,
  style = {},
}: ClientNameDropdownProps) => {
  const [clients, setClients] = useState<ClientResponseModel[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { getClients } = useGetClient();

  // 초기 데이터 로드
  useEffect(() => {
    const abortController = new AbortController();
    let isCurrentRequest = true;

    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const response = await getClients({
          q: searchTerm,
          page: 1,
          page_size: 5,
        });

        // 컴포넌트가 언마운트되었거나 새로운 요청이 시작된 경우 무시
        if (!isCurrentRequest) {
          return;
        }

        const newClients = response?.data?.data || [];
        const nextPage = response?.data?.nextPage;

        setClients(newClients);
        setCurrentPage(1);
        setHasMore(!!nextPage);
      } catch (error) {
        if (!isCurrentRequest) {
          return;
        }
        console.error('Failed to fetch clients:', error);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // 더 많은 거래처 로드
  const loadMoreClients = useCallback(async () => {
    if (isLoading || !hasMore) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await getClients({
        q: searchTerm,
        page: currentPage + 1,
        page_size: 5,
      });
      const newClients = response?.data?.data || [];
      const nextPage = response?.data?.nextPage;

      setClients((prev) => [...prev, ...newClients]);
      setCurrentPage((prev) => prev + 1);
      setHasMore(!!nextPage);
    } catch (error) {
      console.error('Failed to load more clients:', error);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, hasMore, searchTerm, currentPage]);

  // 검색 결과가 없으면 드롭다운 표시 안 함
  if (clients.length === 0) {
    return null;
  }

  return (
    <Dropdown
      onClose={onClose}
      width={width}
      style={style}
      maxHeight="max-h-[180px]"
      onLoadMore={loadMoreClients}
      hasMore={hasMore}
      isLoading={isLoading}
    >
      {clients.map((item, index) => (
        <DropdownItem
          key={`${item.id}-${index}`}
          text={item.name}
          onClick={() => onSelect(item)}
          search={true}
        />
      ))}
    </Dropdown>
  );
};
