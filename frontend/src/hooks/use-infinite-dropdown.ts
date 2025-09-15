import { useCallback, useEffect, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';

export interface PageResultModel<T> {
  data: T[];
  curPage: number;
  pageCnt: number;
}

export interface FetchPageParamsModel {
  q?: string;
  page: number;
  page_size: number;
}

export type FetchPageFnType<T> = (
  params: FetchPageParamsModel
) => Promise<
  | { success: true; data: { data: T[]; curPage?: number; pageCnt?: number } }
  | { success: false; error?: string }
>;

interface UseInfiniteDropdownOptionsModel<T> {
  fetchPage: FetchPageFnType<T>;
  pageSize?: number;
  debounceMs?: number;
}

export const useInfiniteDropdown = <T>(
  searchKeyword: string,
  {
    fetchPage,
    pageSize = 6,
    debounceMs = 300,
  }: UseInfiniteDropdownOptionsModel<T>
) => {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const isFetchingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [debouncedKeyword] = useDebounce(searchKeyword, debounceMs);

  const loadPage = useCallback(
    async (targetPage: number, replace = false) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      const result = await fetchPage({
        q: debouncedKeyword.trim() || undefined,
        page: targetPage,
        page_size: pageSize,
      });
      if ('success' in result && result.success && result.data) {
        const nextItems = result.data.data || [];
        setItems((prev) => (replace ? nextItems : [...prev, ...nextItems]));
        const cur = result.data.curPage ?? targetPage;
        const total = result.data.pageCnt ?? targetPage;
        setPage(cur);
        setHasMore(cur < total);
      } else {
        // 실패 시 더 이상 호출하지 않도록 막지는 않음
      }
      isFetchingRef.current = false;
    },
    [debouncedKeyword, fetchPage, pageSize]
  );

  // Initial and search changes
  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    loadPage(1, true);
  }, [debouncedKeyword, loadPage]);

  const onScroll = useCallback(
    async (e: React.UIEvent<HTMLDivElement>) => {
      if (isFetchingRef.current || !hasMore) return;
      const target = e.currentTarget;
      const threshold = 24;
      if (
        target.scrollTop + target.clientHeight >=
        target.scrollHeight - threshold
      ) {
        await loadPage(page + 1, false);
      }
    },
    [hasMore, loadPage, page]
  );

  return {
    items,
    isOpen,
    setIsOpen,
    onScroll,
    containerRef,
  };
};

export default useInfiniteDropdown;
