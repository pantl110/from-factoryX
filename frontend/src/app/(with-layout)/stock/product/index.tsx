'use client'

import TableHeader from './table-header'
import TableItem from './table-item'
import { useState, useEffect } from 'react'
import ProductDetail from './product-detail'
import SearchInput from '@/ui/search-input'
import MiniBtn from '@/ui/mini-btn'
import DeleteModal from '@/ui/modal/delete-modal'
import Pagination from '@/components/pagination'
import { ProductResponseModel } from '@/types/data-model'
import { useCheckAll, useGetProduct } from '@/hooks'

interface ProductProps {
  setSelectedProductIdToParent?: (setter: (id: number | null) => void) => void;
  isProductDetailPanelOpen?: boolean;
  setIsProductDetailPanelOpen?: (open: boolean) => void;
}

const Product = ({ setSelectedProductIdToParent, isProductDetailPanelOpen, setIsProductDetailPanelOpen }: ProductProps) => {
  const { getProductList, productList, pagination } = useGetProduct()

  const [searchKeyword, setSearchKeyword] = useState('')
  const [_currentPage, setCurrentPage] = useState(1)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  // 패널 오픈 상태를 부모에서 제어할 경우 prop을 우선 사용
  const [internalPanelOpen, setInternalPanelOpen] = useState(false);
  const panelOpen = typeof isProductDetailPanelOpen === 'boolean' ? isProductDetailPanelOpen : internalPanelOpen;
  const setPanelOpen = setIsProductDetailPanelOpen || setInternalPanelOpen;
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  useEffect(() => {
    if (setSelectedProductIdToParent) {
      setSelectedProductIdToParent(() => setSelectedProductId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setSelectedProductIdToParent]);

  // 제품 목록 로드 함수
  const loadProducts = (page = 1, search = '') => {
    getProductList({
      name: search || undefined,
      page,
      page_size: 10,
    })
  }

  // 초기 로드
  useEffect(() => {
    loadProducts()
  }, []) // 빈 의존성 배열로 초기 로드만 실행

  // 검색 처리
  const handleSearch = (term: string) => {
    setSearchKeyword(term)
    setCurrentPage(1)
    loadProducts(1, term)
  }

  // 페이지 변경
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    loadProducts(page, searchKeyword)
  }

  const {
    checkedCount,
    isAllChecked,
    isChecked,
    toggleAll,
    toggleOne,
    setAllChecked,
    getDeleteButtonText,
  } = useCheckAll(productList.map((item) => item.id))

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

  return (
    <>
      <div className="flex items-center justify-between pb-4">
        <SearchInput
          value={searchKeyword}
          onChange={handleSearch}
          placeholder="품목명 또는 품목코드를 검색하세요."
        />
        <div className="flex gap-1">
          <MiniBtn
            text="취소"
            textColor="text-dg"
            borderColor="border-lg"
            bgColor="bg-white"
            hoverColor="hover:bg-bg"
            onClick={() => setAllChecked(false)}
          />
          <MiniBtn
            text={getDeleteButtonText()}
            textColor={checkedCount > 0 ? 'text-red' : 'text-dg'}
            borderColor={checkedCount > 0 ? 'border-none' : 'border-lg'}
            bgColor={checkedCount > 0 ? 'bg-red-8' : 'bg-wh'}
            hoverColor={checkedCount > 0 ? 'hover:bg-red-hover' : 'hover:bg-bg'}
            onClick={checkedCount > 0 ? () => setIsDeleteModalOpen(true) : () => { }}
          />
        </div>
      </div>

      <div>
        <TableHeader isAllChecked={isAllChecked} onToggleAll={toggleAll} />
        {productList.map((product) => (
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
      {pagination && pagination.pageCnt > 1 && (
        <Pagination
          currentPage={pagination.curPage}
          totalPages={pagination.pageCnt}
          onPageChange={handlePageChange}
        />
      )}

      {panelOpen && (
        <ProductDetail
          key={selectedProductId ?? 'create'}
          productId={selectedProductId}
          productList={productList}
          onClose={handlePanelClose}
          onSuccess={() => {
            // 저장 성공 후 목록 새로고침
            loadProducts(_currentPage, searchKeyword)
          }}
        />
      )}
      {isDeleteModalOpen && <DeleteModal onClose={() => setIsDeleteModalOpen(false)} />}
    </>
  )
}

export default Product
