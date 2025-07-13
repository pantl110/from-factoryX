'use client'

import TableHeader from './table-header'
import TableItem from './table-item'
import { productData } from '@/mocks/product-data'
import { useState } from 'react'
import ProductDetail from './product-detail'
import SearchInput from '@/ui/search-input'
import MiniBtn from '@/ui/mini-btn'
import DeleteModal from '@/ui/modal/delete-modal'
import { ProductDataModel } from '@/types/data-model'
import { useCheckAll } from '@/hooks/use-check-all'

interface ProductProps {
  isCreatePanelOpen: boolean
  setIsCreatePanelOpen: (isOpen: boolean) => void
}

const Product = ({ isCreatePanelOpen, setIsCreatePanelOpen }: ProductProps) => {
  const {
    checkedCount,
    isAllChecked,
    isChecked,
    toggleAll,
    toggleOne,
    setAllChecked,
    getDeleteButtonText,
  } = useCheckAll(productData.map((item) => item.id ?? 0))

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductDataModel | null>(null)

  const handleItemClick = (product: ProductDataModel) => {
    setSelectedProduct(product)
  }
  const handlePanelClose = () => {
    setSelectedProduct(null)
    setIsCreatePanelOpen(false)
  }

  const isPanelOpen = selectedProduct !== null || isCreatePanelOpen
  const mode = isCreatePanelOpen ? 'create' : 'view'

  return (
    <>
      <div className="flex items-center justify-between pb-4">
        <SearchInput />
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
            onClick={checkedCount > 0 ? () => setIsDeleteModalOpen(true) : () => {}}
          />
        </div>
      </div>

      <div>
        <TableHeader isAllChecked={isAllChecked} onToggleAll={toggleAll} />
        {productData.map((item) => (
          <TableItem
            key={item.id}
            productName={item.productName}
            productCode={item.productCode ?? ''}
            size={item.size ?? ''}
            unit={item.unit ?? ''}
            stock={item.stock ?? 0}
            onClick={() => handleItemClick(item)}
            checked={isChecked(item.id ?? 0)}
            onToggle={() => toggleOne(item.id ?? 0)}
          />
        ))}
      </div>

      {isPanelOpen && (
        <ProductDetail
          key={selectedProduct?.id || 'create'}
          product={selectedProduct}
          onClose={handlePanelClose}
          mode={mode}
        />
      )}
      {isDeleteModalOpen && <DeleteModal onClose={() => setIsDeleteModalOpen(false)} />}
    </>
  )
}

export default Product
