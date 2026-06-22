'use client';

import TableHeader from './table-header';
import TableItem from './table-item';
import { useState, useEffect, useCallback } from 'react';
import ProductDetail from './product-detail';
import SearchInput from '@/ui/search-input';
import MiniBtn from '@/ui/mini-btn';
import DeleteModal from '@/ui/modal/delete-modal';
import Pagination from '@/components/pagination';
import { ProductResponseModel } from '@/types/data-model';
import { useCheckAll, useGetProduct, useDeleteProduct } from '@/hooks';
import Spinner from '@/ui/spinner';
import NoHistoryBox from '@/ui/no-history-box';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { useTranslations } from 'next-intl';

interface ProductProps {
  setSelectedProductIdToParent?: (setter: (id: number | null) => void) => void;
  setReloadFunctionToParent?: (setter: () => void) => void;
  isProductDetailPanelOpen?: boolean;
  setIsProductDetailPanelOpen?: (open: boolean) => void;
}

const Product = ({
  isProductDetailPanelOpen,
  setIsProductDetailPanelOpen,
  setReloadFunctionToParent,
}: ProductProps) => {
  const t = useTranslations('stock.product');
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  const { getProductList, productList, pagination, isLoading } =
    useGetProduct();
  const { deleteProduct } = useDeleteProduct();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [_currentPage, setCurrentPage] = useState(1);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // 패널 오픈 상태를 부모에서 제어할 경우 prop을 우선 사용
  const [isInternalPanelOpen, setIsInternalPanelOpen] = useState(false);
  const isPanelOpen =
    typeof isProductDetailPanelOpen === 'boolean'
      ? isProductDetailPanelOpen
      : isInternalPanelOpen;
  const setPanelOpen = setIsProductDetailPanelOpen || setIsInternalPanelOpen;
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );

  // 제품 목록 로드 함수
  const loadProducts = useCallback(
    (page = 1, search = '') => {
      getProductList({
        q: search || undefined,
        page,
        page_size: 10,
      });
    },
    [getProductList]
  );

  // 초기 로드
  useEffect(() => {
    loadProducts();
  }, [loadProducts]); // loadProducts 의존성 추가

  // 부모에게 리로드 함수 전달
  useEffect(() => {
    if (setReloadFunctionToParent) {
      setReloadFunctionToParent(() => {
        // 검색어 초기화하고 첫 페이지로 이동
        setSearchKeyword('');
        setCurrentPage(1);
        loadProducts(1, '');
      });
    }
  }, [setReloadFunctionToParent, loadProducts]);

  // 검색 처리
  const handleSearch = (term: string) => {
    setSearchKeyword(term);
    setCurrentPage(1);
    loadProducts(1, term);
  };

  // 페이지 변경
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadProducts(page, searchKeyword);
  };

  // 페이지 유효성 관리 (삭제나 비어 있는 페이지 처리)
  useEffect(() => {
    const totalPages = pagination?.pageCnt || 0;
    const hasData = productList.length > 0;

    if (totalPages > 0 && _currentPage > totalPages) {
      setCurrentPage(totalPages);
      loadProducts(totalPages, searchKeyword);
      return;
    }

    if (!isLoading && _currentPage > 1 && !hasData) {
      const previousPage = _currentPage - 1;
      setCurrentPage(previousPage);
      loadProducts(previousPage, searchKeyword);
    }
  }, [
    pagination?.pageCnt,
    productList.length,
    _currentPage,
    isLoading,
    loadProducts,
    searchKeyword,
  ]);

  const {
    checkedCount,
    isAllChecked,
    isChecked,
    toggleAll,
    toggleOne,
    setAllChecked,
    getDeleteButtonText,
  } = useCheckAll(productList.map((item: ProductResponseModel) => item.id));

  // 리스트 아이템 클릭 시
  const handleItemClick = (product: ProductResponseModel) => {
    setSelectedProductId(product.id);
    setPanelOpen(true);
  };
  // 패널 닫기
  const handlePanelClose = () => {
    setPanelOpen(false);
    setSelectedProductId(null);
  };

  // 삭제 처리 함수
  const handleDelete = async () => {
    const checkedIds = productList
      .filter((item: ProductResponseModel) => isChecked(item.id))
      .map((item: ProductResponseModel) => item.id);
    if (checkedIds.length === 0) return;
    for (const id of checkedIds) {
      await deleteProduct(id);
    }
    setIsDeleteModalOpen(false);
    setAllChecked(false);
    loadProducts(_currentPage, searchKeyword);
  };

  return (
    <>
      <div className="flex items-center justify-between pb-4">
        <SearchInput
          value={searchKeyword}
          onChange={handleSearch}
          placeholder={t('searchPlaceholder')}
        />
        {productList.length > 0 && !isViewer && hasSubscription() && (
          <div className="flex gap-1">
            {/* <MiniBtn variant="outline"
              text="취소"
              onClick={() => setAllChecked(false)}
            /> */}
            <MiniBtn
              variant={checkedCount > 0 ? 'red' : 'outline'}
              text={getDeleteButtonText()}
              onClick={
                checkedCount > 0 ? () => setIsDeleteModalOpen(true) : () => {}
              }
            />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-100">
          <Spinner />
        </div>
      ) : productList.length === 0 ? (
        <NoHistoryBox title={t('empty.title')} text={t('empty.description')} />
      ) : (
        <>
          <div>
            <TableHeader isAllChecked={isAllChecked} onToggleAll={toggleAll} />
            {productList.length > 0 &&
              productList.map((product: ProductResponseModel) => (
                <TableItem
                  key={product.id}
                  product={product}
                  onClick={() => handleItemClick(product)}
                  checked={isChecked(product.id)}
                  onToggle={() => toggleOne(product.id)}
                />
              ))}
          </div>

          {/* 페이지네이션 */}
          {pagination && pagination.pageCnt && pagination.pageCnt > 1 && (
            <Pagination
              currentPage={pagination.curPage || 1}
              totalPages={pagination.pageCnt}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      {isPanelOpen && (
        <ProductDetail
          key={selectedProductId ?? 'create'}
          productId={selectedProductId}
          onClose={handlePanelClose}
          onSuccess={() => {
            // 저장 성공 후 목록 새로고침
            loadProducts(_currentPage, searchKeyword);
          }}
        />
      )}
      {isDeleteModalOpen && (
        <DeleteModal
          onClose={() => setIsDeleteModalOpen(false)}
          onDelete={handleDelete}
        />
      )}
    </>
  );
};

export default Product;
