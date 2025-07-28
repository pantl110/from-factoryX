import { useDropdownFilter } from '@/hooks/use-dropdown-filter';
import { productData } from '@/mocks/product-data';
import { ProductModel, ProductResponseModel } from '@/types/data-model';
import { ProductNameDropdown } from '@/ui/dropdown/product-name-dropdown';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import SearchInput from '@/ui/search-input';
import { X } from '@phosphor-icons/react/dist/ssr';
import { useState } from 'react';
import ManualAddProduct from '@/app/(with-layout)/stock/material/modals/manual-add-product';

interface ProductEnrollmentModalProps {
  onClose?: () => void;
}

const ProductEnrollmentModal = ({ onClose }: ProductEnrollmentModalProps) => {
  const { input, setInput, isOpen, setIsOpen, filtered, handleSelect } =
    useDropdownFilter(productData, (item) => item.productName);

  const [selectedProducts, setSelectedProducts] = useState<ProductModel[]>([]);
  const [isManualAddMode, setIsManualAddMode] = useState(false);

  // 품목 선택 시
  const handleSelectProduct = (item: ProductResponseModel) => {
    // ProductDataModel로 변환
    const dataModel: ProductModel = {
      factory: item.factory,
      name: item.name,
      code: item.code,
      spec: item.spec,
      unit: item.unit,
      current_stock: item.current_stock,
      average_production_time: item.average_production_time,
      buffer_rate: item.buffer_rate,
      note: item.note || '',
    };
    handleSelect(dataModel);
    setInput('');
    setSelectedProducts((prev) => {
      if (!prev.some((product) => product.name === dataModel.name)) {
        return [...prev, dataModel];
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
      width="w-[600px]"
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
              items={filtered.map((item) => ({
                id: typeof item.id === 'number' ? item.id : 0,
                created_at: '',
                updated_at: '',
                factory: 0,
                name: item.productName || '',
                code: item.productCode || '',
                unit: item.unit || '',
                spec: item.size || '',
                current_stock: item.stock,
                average_production_time: item.productionTime
                  ? Number(item.productionTime)
                  : 0,
                buffer_rate: 0,
                location: 0,
                note: Array.isArray(item.comment) ? item.comment.join(',') : '',
              }))}
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
