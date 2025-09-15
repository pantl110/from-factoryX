import SearchInput from '@/ui/search-input';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import { useState, useEffect } from 'react';
import {
  ProductResponseModel,
  MaterialItemModel,
  ProductListResponseModel,
} from '@/types/data-model';
import { ProductNameDropdown } from '@/ui/dropdown/product-name-dropdown';
import ManualAddProduct from './manual-add-product';
import { useGetProduct, useAssignProduct } from '@/hooks';
import useMemberStore from '@/store/member-store';
import ConnetionItem from '../../modals/connetion-item';

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
  const factoryId = useMemberStore((state) => state.factoryId);

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
          const responseData = firstPageResult.data as ProductListResponseModel;
          const totalCnt = responseData.totalCnt || responseData.count || 0;

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

  // 품목 수량 변경
  const handleQuantityChange = (code: string, newQuantity: number) => {
    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.code === code ? { ...product, quantity: newQuantity } : product
      )
    );
  };

  const handleAddProducts = async () => {
    if (selectedProducts.length === 0) return;

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
        quantity: product.quantity || 0,
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
      subtitle="품목을 선택하거나 새로 추가한 뒤, 해당 품목 제작에 필요한 원자재 투입량을 설정해 주세요."
      width="w-[600px]"
      onClose={onClose}
      scroll={true}
    >
      <div className="my-4 flex gap-2.5 relative px-6">
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
          hoverColor="hover:bg-bg"
          height="h-12"
          onClick={() => setIsManualAddMode(true)}
        />

        {isOpen && filteredProducts.length > 0 && (
          <div className="absolute left-6 top-14 w-[449.3px] z-10">
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
      <div className="px-6 pb-6 max-h-[calc(85vh-181px)] overflow-y-auto scrollbar-hide">
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
            <div className="mb-4 flex flex-col gap-3">
              {selectedProducts.map((product, index) => (
                <ConnetionItem
                  key={`${product.name}-${index}`}
                  name={product.name}
                  unit={product.unit}
                  quantity={product.quantity || 0}
                  onQuantityChange={(quantity) =>
                    handleQuantityChange(product.code, quantity)
                  }
                  onDelete={() => handleRemoveProduct(product.code)}
                />
              ))}
            </div>
          )
        )}

        <div className="flex gap-2.5 justify-end">
          <MiniBtn
            text="취소"
            textColor="text-sv"
            hoverColor="hover:bg-bg"
            onClick={onClose}
          />
          <MiniBtn
            text="추가"
            textColor="text-wh"
            bgColor="bg-primary"
            hoverColor="hover:bg-primary-hover"
            disabled={
              selectedProducts.length === 0 ||
              isManualAddMode ||
              isAssignLoading
            }
            onClick={handleAddProducts}
          />
        </div>
      </div>
    </Modal>
  );
};

export default ProductEnrollmentModal;
