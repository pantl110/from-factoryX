'use client'

import Input from '@/ui/input'
import MiniBtn from '@/ui/mini-btn'
import Modal from '@/ui/modal/modal'
import SearchInput from '@/ui/search-input'
import { useState } from 'react'
import { ProductNameDropdown } from '@/ui/dropdown/product-name-dropdown'
import { ProductDataModel, ProductResponseModel } from '@/types/data-model'
import { productData } from '@/mocks/product-data'
import { useDropdownFilter } from '@/hooks/use-dropdown-filter'
import { useInput } from '@/hooks/use-input'
import { getToday } from '@/hooks/get-today'
import { formatDate } from '@/hooks/format-number'

interface AddReturnModalProps {
  onClose: () => void
}

const AddReturnModal = ({ onClose }: AddReturnModalProps) => {
  const {
    input: productName,
    isOpen: isProductNameDropdownOpen,
    setIsOpen: setIsProductNameDropdownOpen,
    filtered: matchedItems,
    handleInputChange,
    handleSelect,
  } = useDropdownFilter(productData, (item) => item.productName)

  // input 검사 훅
  const {
    value: returnQuantity,
    error: returnQuantityError,
    handleChange: handleReturnQuantityChange,
  } = useInput({
    validate: (v) => (!v ? '반품 수량을 입력해 주세요.' : ''),
    initialValue: '',
  })

  // 날짜 입력 useInput 적용
  const {
    value: returnDate,
    error: returnDateError,
    handleChange: handleReturnDateChange,
  } = useInput({
    validate: (v) => (!v ? '반품 일자를 입력해 주세요.' : ''),
    initialValue: getToday(),
  })

  const [_selectedProductName, setSelectedProductName] = useState<ProductDataModel | null>(null)

  const [showSearchIcon, setShowSearchIcon] = useState(true)

  // 드롭다운에서 선택 시 두 상태를 각각 업데이트
  const handleSelectProduct = (item: ProductResponseModel) => {
    // ProductDataModel로 변환
    const dataModel: ProductDataModel = {
      id: item.id,
      productName: item.name,
      productCode: item.code,
      size: item.spec,
      unit: item.unit,
      stock: item.current_stock,
      productionTime: item.average_production_time?.toString(),
      comment: item.note ? item.note.split(',') : [],
    }
    setSelectedProductName(dataModel)
    handleSelect(dataModel)
    handleReturnQuantityChange(item.current_stock?.toString() || '')
    setShowSearchIcon(false)
  }

  return (
    <Modal
      title="반품할 상품을 등록해 주세요."
      subtitle="반품할 품목명과 수량을 입력해 주세요."
      onClose={onClose}
      width="w-[600px]"
    >
      <div className="w-full mt-4 relative">
        <SearchInput
          placeholder="품목명 검색"
          width="w-full"
          value={productName}
          onChange={(value) =>
            handleInputChange({
              target: { value },
            } as React.ChangeEvent<HTMLInputElement>)
          }
          onFocus={() => {
            setIsProductNameDropdownOpen(true)
            setShowSearchIcon(true)
          }}
          onBlur={() => setTimeout(() => setIsProductNameDropdownOpen(false), 100)}
          showIcon={showSearchIcon}
        />
        {isProductNameDropdownOpen && matchedItems.length > 0 && (
          <div className="absolute left-0 top-[calc(100%+8px)] z-10">
            <ProductNameDropdown
              items={matchedItems.map((item) => ({
                id: typeof item.id === 'number' ? item.id : 0,
                created_at: '',
                updated_at: '',
                factory: 0,
                name: item.productName || '',
                code: item.productCode || '',
                unit: item.unit || '',
                spec: item.size || '',
                current_stock: item.stock,
                average_production_time: item.productionTime ? Number(item.productionTime) : 0,
                buffer_rate: 0,
                location: 0,
                note: Array.isArray(item.comment) ? item.comment.join(',') : '',
              }))}
              onSelect={handleSelectProduct}
              width="w-[551px]"
            />
          </div>
        )}
      </div>
      <div className="w-full mt-4">
        <Input
          label="반품 수량"
          placeholder="반품할 수량을 입력해 주세요."
          required
          value={returnQuantity}
          onChange={(e) => handleReturnQuantityChange(e.target.value)}
          showError={!!returnQuantityError}
          type="number"
        />
      </div>
      <div className="w-full mt-4">
        <Input
          label="반품 일자"
          placeholder="반품할 일자를 입력해 주세요."
          required
          value={returnDate}
          onChange={(e) => {
            const formatted = formatDate(e.target.value)
            handleReturnDateChange(formatted)
          }}
          showError={!!returnDateError}
        />
      </div>
      <div className="flex gap-2.5 mt-4 justify-end">
        <MiniBtn text="취소" onClick={onClose} textColor="text-sv" hoverColor="" />
        <MiniBtn
          text="등록"
          onClick={onClose}
          textColor="text-wh"
          bgColor="bg-primary"
          hoverColor="hover:bg-primary-hover"
        />
      </div>
    </Modal>
  )
}

export default AddReturnModal
