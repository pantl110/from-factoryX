"use client";

import Input from "@/ui/input";
import MiniBtn from "@/ui/mini-btn";
import Modal from "@/ui/modal/modal";
import SearchInput from "@/ui/search-input";
import { useState } from "react";
import { ProductNameDropdown } from "@/ui/dropdown/product-name-dropdown";
import { ProductDataModel } from "@/types/data-model";
import { productData } from "@/mocks/product-data";
import { useDropdownFilter } from "@/hooks/use-dropdown-filter";
import { useInput } from "@/hooks/use-input";
import { getToday } from "@/hooks/get-today";

interface AddReturnModalProps {
  onClose: () => void;
}

const AddReturnModal = ({ onClose }: AddReturnModalProps) => {
  const {
    input: productName,
    isOpen: isProductNameDropdownOpen,
    setIsOpen: setIsProductNameDropdownOpen,
    filtered: matchedItems,
    handleInputChange,
    handleSelect,
  } = useDropdownFilter(productData, (item) => item.productName);

  // input 검사 훅
  const {
    value: returnQuantity,
    error: returnQuantityError,
    handleChange: handleReturnQuantityChange,
  } = useInput({
    validate: (v) => (!v ? "반품 수량을 입력해 주세요." : ""),
    initialValue: "",
  });

  // 날짜 입력 useInput 적용
  const {
    value: returnDate,
    error: returnDateError,
    handleChange: handleReturnDateChange,
  } = useInput({
    validate: (v) => (!v ? "반품 일자를 입력해 주세요." : ""),
    initialValue: getToday(),
  });

  const [_selectedProductName, setSelectedProductName] =
    useState<ProductDataModel | null>(null);

  const [showSearchIcon, setShowSearchIcon] = useState(true);

  // 드롭다운에서 선택 시 두 상태를 각각 업데이트
  const handleSelectProduct = (item: ProductDataModel) => {
    setSelectedProductName(item);
    handleSelect(item);
    handleReturnQuantityChange(item.returnQuantity?.toString() || "");
    setShowSearchIcon(false);
  };

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
            setIsProductNameDropdownOpen(true);
            setShowSearchIcon(true);
          }}
          onBlur={() =>
            setTimeout(() => setIsProductNameDropdownOpen(false), 100)
          }
          showIcon={showSearchIcon}
        />
        {isProductNameDropdownOpen && matchedItems.length > 0 && (
          <div className="absolute left-0 top-[calc(100%+8px)] z-10">
            <ProductNameDropdown
              items={matchedItems as ProductDataModel[]}
              onSelect={handleSelectProduct}
              width="w-[586px]"
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
          onChange={handleReturnQuantityChange}
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
          onChange={handleReturnDateChange}
          showError={!!returnDateError}
          type="date"
        />
      </div>
      <div className="flex gap-2.5 mt-4 justify-end">
        <MiniBtn
          text="취소하기"
          onClick={onClose}
          textColor="text-sv"
          hoverColor=""
        />
        <MiniBtn
          text="등록하기"
          onClick={onClose}
          textColor="text-wh"
          bgColor="bg-primary"
          hoverColor="hover:bg-primary-hover"
        />
      </div>
    </Modal>
  );
};

export default AddReturnModal;
