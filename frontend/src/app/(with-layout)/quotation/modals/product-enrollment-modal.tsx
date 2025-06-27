import { useDropdownFilter } from "@/hooks/use-dropdown-filter";
import { productData } from "@/mocks/product-data";
import { ProductDataModel } from "@/types/data-model";
import { ProductNameDropdown } from "@/ui/dropdown/product-name-dropdown";
import MiniBtn from "@/ui/mini-btn";
import Modal from "@/ui/modal/modal";
import SearchInput from "@/ui/search-input";
import { X } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import ManualAddProduct from "@/app/(with-layout)/stock/material/modals/manual-add-product";

interface ProductEnrollmentModalProps {
  onClose?: () => void;
}

const ProductEnrollmentModal = ({ onClose }: ProductEnrollmentModalProps) => {
  const { input, setInput, isOpen, setIsOpen, filtered, handleSelect } =
    useDropdownFilter(productData, (item) => item.productName);

  const [selectedProducts, setSelectedProducts] = useState<ProductDataModel[]>(
    [],
  );
  const [isManualAddMode, setIsManualAddMode] = useState(false);

  // 품목 선택 시
  const handleSelectProduct = (item: ProductDataModel) => {
    handleSelect(item);
    setInput("");
    setSelectedProducts((prev) => {
      if (!prev.some((product) => product.id === item.id)) {
        return [...prev, item];
      }
      return prev;
    });
    setIsOpen(false);
  };

  const handleRemoveProduct = (id: number) => {
    setSelectedProducts((prev) => prev.filter((product) => product.id !== id));
  };

  return (
    <Modal
      title="견적서에 포함되지 않은 품목을 추가해 주세요."
      subtitle="OCR로 인식되지 않았거나, 추가 요청된 품목이 있다면 등록해 주세요."
      width="w-[586px]"
      onClose={onClose}
    >
      <div className="mt-4 flex gap-2.5 relative">
        <SearchInput
          placeholder="품목명 검색"
          width="flex-1"
          value={input}
          onChange={setInput}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        />
        <MiniBtn
          text="직접 추가"
          textColor="text-dg"
          borderColor="border-lg"
          hoverColor="bg-bg"
          height="h-12"
          onClick={() => setIsManualAddMode(true)}
        />

        {isOpen && filtered.length > 0 && (
          <div className="absolute left-0 top-12 z-10 w-[437px]">
            <ProductNameDropdown
              items={filtered}
              onSelect={handleSelectProduct}
              width="w-full"
            />
          </div>
        )}
      </div>

      {/* 직접 추가 모드 */}
      {isManualAddMode ? (
        <ManualAddProduct
          setIsManualAddMode={setIsManualAddMode}
          setSelectedProducts={setSelectedProducts}
        />
      ) : (
        // 선택한 품목 list
        selectedProducts.length > 0 && (
          <div className="mt-4 flex flex-col">
            {selectedProducts.map((product) => (
              <div
                key={product.id}
                className="flex justify-between items-center h-10"
              >
                <p className="Me_body-1 text-dg">{product.productName}</p>
                {product.id !== null && product.id !== undefined && (
                  <div
                    className="cursor-pointer w-10 h-10 flex justify-center items-center"
                    onClick={() => handleRemoveProduct(product.id as number)}
                  >
                    <X size={16} className="text-gr" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      <div className="mt-4 flex gap-2.5 justify-end">
        <MiniBtn
          text="취소하기"
          textColor="text-sv"
          hoverColor="bg-bg"
          onClick={onClose}
        />
        <MiniBtn
          text="추가하기"
          textColor="text-wh"
          bgColor="bg-primary"
          hoverColor="hover:bg-primary-hover"
          disabled={selectedProducts.length === 0 || isManualAddMode}
          onClick={onClose}
        />
      </div>
    </Modal>
  );
};

export default ProductEnrollmentModal;
