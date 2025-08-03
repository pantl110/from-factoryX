import SearchInput from '@/ui/search-input';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import { useState, useEffect } from 'react';
import { ProductResponseModel, MaterialItemModel } from '@/types/data-model';
import { ProductNameDropdown } from '@/ui/dropdown/product-name-dropdown';
import { X } from '@phosphor-icons/react/dist/ssr';
import ManualAddProduct from './manual-add-product';
import { useGetProduct, useAssignProduct } from '@/hooks';

interface ProductEnrollmentModalProps {
  onClose?: () => void;
  materialId: number;
  onSuccess?: () => void;
  checkDuplicateProductCode?: (
    code: string,
    selectedProducts?: MaterialItemModel[]
  ) => boolean;
  showDuplicateProductToast?: () => void;
}

// 로컬스토리지에서 factoryId를 안전하게 가져오는 함수
const getStoredFactoryId = (): number | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('factoryId');
    return stored ? parseInt(stored, 10) : null;
  } catch {
    return null;
  }
};

const ProductEnrollmentModal = ({
  onClose,
  materialId,
  onSuccess,
  checkDuplicateProductCode,
  showDuplicateProductToast,
}: ProductEnrollmentModalProps) => {
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<
    ProductResponseModel[]
  >([]);
  const { getProductList } = useGetProduct();
  const { assignProduct, isLoading: isAssignLoading } = useAssignProduct();

  const [selectedProducts, setSelectedProducts] = useState<MaterialItemModel[]>(
    []
  );
  const [isManualAddMode, setIsManualAddMode] = useState(false);

  // 검색어가 변경될 때 서버에서 검색
  useEffect(() => {
    const searchProducts = async () => {
      if (input.trim()) {
        // 첫 페이지를 가져와서 전체 개수 확인
        const firstPageResult = await getProductList({
          q: input,
          page: 1,
          page_size: 10,
        });

        if (firstPageResult.success && firstPageResult.data) {
          const { totalCnt } = firstPageResult.data;

          // 전체 개수를 알았으니 한 번에 모든 데이터 가져오기
          const allDataResult = await getProductList({
            q: input,
            page: 1,
            page_size: totalCnt,
          });

          if (allDataResult.success && allDataResult.data) {
            setFilteredProducts(allDataResult.data.data);
          }
        }
      } else {
        setFilteredProducts([]);
      }
    };

    const timeoutId = setTimeout(searchProducts, 150); // 디바운스
    return () => clearTimeout(timeoutId);
  }, [input, getProductList]);

  // 품목 선택 시 - ProductResponseModel을 MaterialItemModel로 변환
  const handleSelectProduct = (product: ProductResponseModel) => {
    const materialItemModel: MaterialItemModel = {
      name: product.name,
      code: product.code,
      spec: product.spec,
      unit: product.unit,
      quantity: null,
      price: null,
    };
    setSelectedProducts((prev) => [...prev, materialItemModel]);
    setInput(''); // 검색어 초기화
    setIsOpen(false); // 드롭다운 닫기
  };

  const handleRemoveProduct = (code: string) => {
    setSelectedProducts((prev) =>
      prev.filter((product) => product.code !== code)
    );
  };

  const handleAddProducts = async () => {
    if (selectedProducts.length === 0) return;

    // 로컬스토리지에서 factoryId 가져오기
    const factoryId = getStoredFactoryId();
    if (!factoryId) {
      alert('공장 정보가 없습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

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
          <div className="absolute left-0 top-14 w-[449.3px] z-10">
            <ProductNameDropdown
              items={filteredProducts}
              onSelect={handleSelectProduct}
              width="w-full"
              onClose={() => setIsOpen(false)}
            />
          </div>
        )}
      </div>

      {/* 직접 추가 모드 */}
      {isManualAddMode ? (
        <ManualAddProduct
          setIsManualAddMode={setIsManualAddMode}
          setSelectedProducts={setSelectedProducts}
          checkDuplicateProductCode={(code) =>
            checkDuplicateProductCode?.(code, selectedProducts) ?? false
          }
          showDuplicateProductToast={showDuplicateProductToast}
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
            selectedProducts.length === 0 || isManualAddMode || isAssignLoading
          }
          onClick={handleAddProducts}
        />
      </div>
    </Modal>
  );
};

export default ProductEnrollmentModal;
