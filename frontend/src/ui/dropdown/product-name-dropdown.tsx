'use client';

import { ProductResponseModel } from '@/types/data-model';
import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';
import { useState, useEffect, useCallback } from 'react';
import { useGetProduct } from '@/hooks';
import { useTranslations } from 'next-intl';

interface ProductNameDropdownProps {
  searchTerm: string;
  onSelect: (item: ProductResponseModel) => void;
  onClose: () => void;
  width?: string;
  showAllOnEmpty?: boolean;
}

export const ProductNameDropdown = ({
  searchTerm,
  onSelect,
  onClose,
  width,
  showAllOnEmpty = false,
}: ProductNameDropdownProps) => {
  const [products, setProducts] = useState<ProductResponseModel[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { getProductList } = useGetProduct();
  const tCommon = useTranslations('common');

  // 초기 데이터 로드
  useEffect(() => {
    const abortController = new AbortController();
    let isCurrentRequest = true;

    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const response = await getProductList({
          q: searchTerm || undefined,
          page: 1,
          page_size: 5,
        });

        // 컴포넌트가 언마운트되었거나 새로운 요청이 시작된 경우 무시
        if (!isCurrentRequest) {
          return;
        }

        const newProducts = response?.data?.data || [];
        const nextPage = response?.data?.nextPage;

        setProducts(newProducts);
        setCurrentPage(1);
        setHasMore(!!nextPage);
      } catch (error) {
        if (!isCurrentRequest) {
          return;
        }
        console.error('Failed to fetch products:', error);
      } finally {
        if (isCurrentRequest) {
          setIsLoading(false);
        }
      }
    };

    if (searchTerm || showAllOnEmpty) {
      fetchInitialData();
    }

    // cleanup: 새로운 요청이 시작되거나 컴포넌트가 언마운트되면 이전 요청 무시
    return () => {
      isCurrentRequest = false;
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, showAllOnEmpty]);

  // 더 많은 제품 로드
  const loadMoreProducts = useCallback(async () => {
    if (isLoading || !hasMore) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await getProductList({
        q: searchTerm || undefined,
        page: currentPage + 1,
        page_size: 5,
      });
      const newProducts = response?.data?.data || [];
      const nextPage = response?.data?.nextPage;

      setProducts((prev) => [...prev, ...newProducts]);
      setCurrentPage((prev) => prev + 1);
      setHasMore(!!nextPage);
    } catch (error) {
      console.error('Failed to load more products:', error);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, hasMore, searchTerm, currentPage]);

  // 검색 결과가 없으면 드롭다운 표시 안 함
  if (products.length === 0) {
    return null;
  }

  return (
    <Dropdown
      onClose={onClose}
      width={width}
      maxHeight="max-h-[180px]"
      onLoadMore={loadMoreProducts}
      hasMore={hasMore}
      isLoading={isLoading}
    >
      {products.map((item, index) => (
        <DropdownItem
          key={`${item.id}-${index}`}
          text={
            item.tax_type_review_required
              ? `${item.name} (${tCommon('taxTypeReviewRequired')})`
              : item.name
          }
          onClick={() => onSelect(item)}
          disabled={item.tax_type_review_required}
          search={true}
        />
      ))}
    </Dropdown>
  );
};
