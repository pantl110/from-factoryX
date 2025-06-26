"use client";

import Input from "@/ui/input";
import MiniBtn from "@/ui/mini-btn";
import Modal from "@/ui/modal/modal";
import SearchInput from "@/ui/search-input";
import { useState } from "react";
import {
  ProductItemModel,
  ProductNameDropdown,
  productNameDropdownItems,
} from "./product-name-dropdown";

interface AddReturnModalProps {
  onClose: () => void;
}

const AddReturnModal = ({ onClose }: AddReturnModalProps) => {
  const [productName, setProductName] = useState("");
  const [returnQuantity, setReturnQuantity] = useState("");
  const [isProductNameDropdownOpen, setIsProductNameDropdownOpen] =
    useState(false);
  const [_selectedProductName, setSelectedProductName] =
    useState<ProductItemModel | null>(null);

  // 입력값과 처음부터 일치하는 항목만 필터링
  const matchedItems = productName
    ? productNameDropdownItems.filter((item) =>
        item.name.startsWith(productName),
      )
    : [];

  // 오늘 날짜를 YYYY-MM-DD로 반환하는 함수
  const getToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // 드롭다운에서 선택 시 두 상태를 각각 업데이트
  const handleSelectProduct = (item: ProductItemModel) => {
    setSelectedProductName(item);
    setProductName(item.name);
    setReturnQuantity(item.return_quantity.toString());
    setIsProductNameDropdownOpen(false);
  };

  return (
    <Modal
      title="반품할 상품을 등록해 주세요."
      subtitle="반품할 품목명과 수량을 입력해 주세요."
      onClose={onClose}
      width="w-[586px]"
    >
      <div className="w-full mt-4 relative">
        <SearchInput
          placeholder="품목명 검색"
          width="w-full"
          value={productName}
          onChange={setProductName}
          onFocus={() => setIsProductNameDropdownOpen(true)}
          onBlur={() =>
            setTimeout(() => setIsProductNameDropdownOpen(false), 100)
          }
        />
        {isProductNameDropdownOpen && matchedItems.length > 0 && (
          <div className="absolute left-0 top-2.5 w-full z-10">
            <ProductNameDropdown
              items={matchedItems}
              onSelect={handleSelectProduct}
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
          onChange={setReturnQuantity}
        />
      </div>
      <div className="w-full mt-4">
        <Input
          label="반품 일자"
          placeholder="반품할 일자를 입력해 주세요."
          required
          value={getToday()}
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
