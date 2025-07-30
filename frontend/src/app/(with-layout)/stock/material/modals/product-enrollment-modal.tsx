import SearchInput from '@/ui/search-input';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import { useState, useEffect } from 'react';
import { ProductResponseModel, MaterialModel } from '@/types/data-model';
// import { ProductNameDropdown } from '@/ui/dropdown/product-name-dropdown';
import { X } from '@phosphor-icons/react/dist/ssr';
import ManualAddProduct from './manual-add-product';
import { useGetProduct, useAssignProduct } from '@/hooks';
import useFactoryStore from '@/store/factory-store';

interface ProductEnrollmentModalProps {
  onClose?: () => void;
  materialId: number;
  onSuccess?: () => void;
}

const ProductEnrollmentModal = ({
  onClose,
  materialId,
  onSuccess,
}: ProductEnrollmentModalProps) => {
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<
    ProductResponseModel[]
  >([]);
  const factoryId = useFactoryStore((state) => state.factoryId);

  const { getProductList } = useGetProduct();
  const { assignProduct, isLoading } = useAssignProduct();

  const [selectedProducts, setSelectedProducts] = useState<MaterialModel[]>([]);
  const [isManualAddMode, setIsManualAddMode] = useState(false);

  // 검색어가 변경될 때 서버에서 검색
  useEffect(() => {
    const searchProducts = async () => {
      if (input.trim() && factoryId) {
        const result = await getProductList({
          factory_id: factoryId,
          q: input,
          page_size: 100,
        });
        if (result.success && result.data) {
          setFilteredProducts(result.data.data);
        }
      } else {
        setFilteredProducts([]);
      }
    };

    const timeoutId = setTimeout(searchProducts, 150); // 디바운스
    return () => clearTimeout(timeoutId);
  }, [input, factoryId, getProductList]);

  // 품목 선택 시 - ProductResponseModel을 MaterialModel로 변환
  const handleRemoveProduct = (code: string) => {
    setSelectedProducts((prev) => prev.filter((prod) => prod.code !== code));
  };

  const handleAddProducts = async () => {
    if (!factoryId || selectedProducts.length === 0) return;

    const result = await assignProduct({
      factory_id: factoryId,
      material_id: materialId,
      products: selectedProducts.map((product) => ({
        name: product.name,
        code: product.code,
        spec: product.spec,
        unit: product.unit,
        quantity: 10, // ‼️‼️‼️‼️‼️‼️‼️ 수정 필요 ‼️‼️‼️‼️ 기본 수량 10으로 설정 ‼️
      })),
    });

    if (result.success) {
      onSuccess?.();
      onClose?.();
    }
  };

  return (
    <Modal
      title="해당 원자재와 연결할 품목을 등록해 주세요."
      width="w-[600px]"
      onClose={onClose}
    >
      <div className="mt-4 flex gap-2.5 relative">
        <SearchInput
          placeholder="품목 검색"
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

        {isOpen && filteredProducts.length > 0 && (
          <div className="absolute left-0 top-12 z-10 w-[437px]">
            {/* <ProductNameDropdown
              items={filteredProducts}
              onSelect={handleSelectProduct}
              width="w-full"
            /> */}
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
            {selectedProducts.map((product, index) => (
              <div
                key={`${product.name}-${index}`}
                className="flex justify-between items-center h-10"
              >
                <p className="Me_body-1 text-dg">{product.name}</p>
                <div
                  className="cursor-pointer w-10 h-10 flex justify-center items-center"
                  onClick={() => handleRemoveProduct(product.code)}
                >
                  <X size={16} className="text-gr" />
                </div>
              </div>
            ))}
          </div>
        )
      )}

      <div className="mt-4 flex gap-2.5 justify-end">
        <MiniBtn
          text="취소"
          textColor="text-sv"
          hoverColor="bg-bg"
          onClick={onClose}
        />
        <MiniBtn
          text="추가"
          textColor="text-wh"
          bgColor="bg-primary"
          hoverColor="hover:bg-primary-hover"
          disabled={
            selectedProducts.length === 0 || isManualAddMode || isLoading
          }
          onClick={handleAddProducts}
        />
      </div>
    </Modal>
  );
};

export default ProductEnrollmentModal;
