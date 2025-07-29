import MiniBtn from '@/ui/mini-btn';
import ProductItem from './product-item';
import { CaretDown } from '@phosphor-icons/react/dist/ssr';
import { useGetDetailQuotation, useGetProduct } from '@/hooks';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  QuotationProductDetailResponseModel,
  ProductResponseModel,
} from '@/types/data-model';
import ProductEnrollmentDropdown from './modals/product-enrollment-dropdown';
import ProductDetail from '../stock/product/product-detail';
import { ProductNameDropdown } from '@/ui/dropdown/product-name-dropdown';
import PriceInfo from '@/ui/price-info';

interface RequestInfoProps {
  onProductClick: (productId: number) => void;
  setHasQuotationProducts: (hasQuotationProducts: boolean) => void;
  onProductsChange?: (products: QuotationProductDetailResponseModel[]) => void;
}

const RequestInfo = ({
  onProductClick,
  setHasQuotationProducts,
  onProductsChange,
}: RequestInfoProps) => {
  const [isProductEnrollmentDropdownOpen, setIsProductEnrollmentDropdownOpen] =
    useState(false);
  const [isAddNewProductClicked, setIsAddNewProductClicked] = useState(false);
  const [selectedProductDetailId, setSelectedProductDetailId] = useState<
    number | null
  >(null);
  const [supplyAmount, setSupplyAmount] = useState<number>(0);

  const searchParams = useSearchParams();
  const quotationId = searchParams.get('id')
    ? parseInt(searchParams.get('id') || '0')
    : undefined;
  const { data: quotationDetail, isLoading: isLoadingQuotation } =
    useGetDetailQuotation(quotationId || 0);
  const { getProductDetail } = useGetProduct();

  // React Hook Form 설정
  const { control, watch, setValue } = useForm({
    defaultValues: {
      products: [] as QuotationProductDetailResponseModel[],
    },
  });

  // 드롭다운 상태를 상위에서 관리
  const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(
    null
  );
  const [dropdownProducts, setDropdownProducts] = useState<
    ProductResponseModel[]
  >([]);
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);

  const { fields, update, append, remove } = useFieldArray({
    control,
    name: 'products',
  });

  // 이전 quotationDetail.products를 저장하기 위한 ref
  const prevQuotationProductsRef = useRef<
    QuotationProductDetailResponseModel[] | null
  >(null);

  // quotationDetail이 변경될 때마다 products를 form에 저장 (사용자 입력값 유지)
  useEffect(() => {
    if (
      quotationDetail &&
      quotationDetail.products &&
      quotationDetail.products.length > 0
    ) {
      // 이전 products와 현재 products가 다른 경우에만 업데이트
      const currentProducts = quotationDetail.products;
      const prevProducts = prevQuotationProductsRef.current;

      // products가 실제로 변경되었는지 확인 (product_id, product_name, product_code, spec, unit만 비교)
      const hasChanged =
        !prevProducts ||
        prevProducts.length !== currentProducts.length ||
        prevProducts.some((prev, index) => {
          const current = currentProducts[index];
          return (
            prev.product_id !== current.product_id ||
            prev.product_name !== current.product_name ||
            prev.product_code !== current.product_code ||
            prev.spec !== current.spec ||
            prev.unit !== current.unit
          );
        });

      if (hasChanged) {
        // 기존 form 값에서 사용자가 입력한 quantity와 unit_price 값을 보존
        const updatedProducts = currentProducts.map((newProduct, index) => {
          const existingProduct = currentProducts[index];
          return {
            ...newProduct,
            // 기존에 사용자가 입력한 값이 있으면 유지, 없으면 새 값 사용
            quantity:
              existingProduct?.quantity !== null &&
              existingProduct?.quantity !== undefined
                ? existingProduct.quantity
                : newProduct.quantity,
            unit_price:
              existingProduct?.unit_price !== null &&
              existingProduct?.unit_price !== undefined
                ? existingProduct.unit_price
                : newProduct.unit_price,
          };
        });
        setValue('products', updatedProducts);
        prevQuotationProductsRef.current = currentProducts;
      }
    } else {
      setValue('products', []);
      prevQuotationProductsRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotationDetail?.products, setValue]);

  // fields가 변경될 때마다 유효성 검사 해서 hasQuotationProducts 업데이트하여 버튼 disabled 여부 결정
  useEffect(() => {
    const hasValidProducts =
      fields.length > 0 &&
      fields.every(
        (field) =>
          field.product_name &&
          field.product_code &&
          field.spec &&
          field.unit &&
          field.quantity &&
          field.unit_price
      );
    setHasQuotationProducts(hasValidProducts);

    // 상위 컴포넌트에 products 데이터 전달
    onProductsChange?.(fields);

    // 총 공급가액 계산
    const totalSupplyAmount = fields.reduce((sum, field) => {
      if (field.quantity && field.unit_price) {
        return sum + field.quantity * field.unit_price;
      }
      return sum;
    }, 0);
    setSupplyAmount(totalSupplyAmount);
  }, [fields, setHasQuotationProducts, onProductsChange]);

  // 제작수량이나 단가가 변경될 때 금액 자동 계산
  const handleQuantityOrPriceChange = (
    index: number,
    field: 'quantity' | 'unit_price',
    value: string
  ) => {
    const numericValue = value ? parseInt(value.replace(/[^0-9]/g, '')) : null;

    // 현재 필드의 값을 가져와서 업데이트
    const currentField = fields[index];
    update(index, {
      ...currentField,
      [field]: numericValue,
    });
  };

  // 품목 삭제
  const handleDeleteProduct = (index: number) => {
    remove(index);
  };

  // 기존 품목 추가 시 빈 품목 추가
  const handleAddEmptyProduct = () => {
    const emptyProduct: QuotationProductDetailResponseModel = {
      product_id: undefined,
      product_name: '',
      product_code: '',
      spec: '',
      unit: '',
      quantity: null,
      unit_price: null,
      supply_amount: null,
    };
    append(emptyProduct);
  };

  // 새로운 품목 추가 시 품목 디테일 판넬에서 저장버튼 누르면
  const handleNewProductAdded = async (productId?: number) => {
    if (productId) {
      const productDetail = await getProductDetail(productId);

      // 새로운 품목을 form에 추가
      const newProduct: QuotationProductDetailResponseModel = {
        product_id: productId,
        product_name: productDetail?.data?.name || '-',
        product_code: productDetail?.data?.code || '-',
        spec: productDetail?.data?.spec || '-',
        unit: productDetail?.data?.unit || '-',
        quantity: null,
        unit_price: null,
        supply_amount: null, // 공급가액
      };

      append(newProduct);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center relative">
        <h3 className="Heading-3">요청 정보</h3>
        <MiniBtn
          text="품목 추가하기"
          textColor="text-dg"
          borderColor="border-lg"
          icon={CaretDown}
          iconPosition="right"
          hoverColor="hover:bg-bg"
          onClick={() => setIsProductEnrollmentDropdownOpen(true)}
        />
        {/* 품목 추가하기 드롭다운 */}
        {isProductEnrollmentDropdownOpen && (
          <div className="absolute top-12 right-0">
            <ProductEnrollmentDropdown
              onClose={() => setIsProductEnrollmentDropdownOpen(false)}
              onAddOldProductClick={() => {
                handleAddEmptyProduct();
                setIsProductEnrollmentDropdownOpen(false);
              }}
              onAddNewProductClick={() => {
                setIsAddNewProductClicked(true);
                setIsProductEnrollmentDropdownOpen(false);
              }}
            />
          </div>
        )}
      </div>

      {!isLoadingQuotation && fields.length > 0 ? (
        <>
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[938px]">
              <thead>
                <tr className="flex items-center h-12 border-t border-b border-lg Me_Body-1 text-sv rounded-sm">
                  <th className="text-left px-3 flex-1">품목명</th>
                  <th className="text-left px-3 flex-1">품목코드</th>
                  <th className="text-left px-3 flex-1">규격</th>
                  <th className="text-left px-3 w-[80px]">단위</th>
                  <th className="text-left px-3 flex-1">제작 수량</th>
                  <th className="text-left px-3 w-[100px]">단가</th>
                  <th className="text-left px-3 flex-1">금액</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {/* 사용자가 입력한 formData (요청 정보) 표시 */}
                {fields.map((item, index) => {
                  return (
                    <ProductItem
                      key={index}
                      data={item}
                      onClick={() => onProductClick(item.product_id || 0)}
                      canDelete={true}
                      onChange={(field, value) => {
                        handleQuantityOrPriceChange(index, field, value);
                      }}
                      onDelete={() => handleDeleteProduct(index)}
                      onDropdownShow={(products, rect) => {
                        setActiveDropdownIndex(index);
                        setDropdownProducts(products);
                        setDropdownRect(rect || null);
                      }}
                      onDropdownHide={() => {
                        setActiveDropdownIndex(null);
                        setDropdownProducts([]);
                        setDropdownRect(null);
                      }}
                      onProductDetailClick={(productId) => {
                        setSelectedProductDetailId(productId);
                      }}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mb-30 w-full flex justify-between items-center">
            <PriceInfo supplyAmount={supplyAmount} />
          </div>
        </>
      ) : (
        <div className="py-8 h-full flex flex-col justify-center items-center gap-2 rounded-[4px] border border-[#E4E4E7]">
          <h4 className="Heading-4 text-dg">요청 정보가 아직 없어요.</h4>
          <p className="R_Body-1 text-gr">
            품목을 추가해서 단가를 측정해 보세요.
          </p>
        </div>
      )}

      {/* 포털 드롭다운 */}
      {activeDropdownIndex !== null &&
        dropdownProducts.length > 0 &&
        dropdownRect && (
          <div
            className="fixed z-10 scrollbar-hide"
            style={{
              top: `${dropdownRect.bottom + 16}px`,
              left: `${dropdownRect.left - 12}px`,
              width: `${dropdownRect.width + 24}px`,
              overflow: 'auto',
            }}
          >
            <ProductNameDropdown
              items={dropdownProducts}
              onSelect={(product: ProductResponseModel) => {
                // 선택된 품목 정보로 해당 행 업데이트
                if (activeDropdownIndex !== null) {
                  update(activeDropdownIndex, {
                    ...fields[activeDropdownIndex],
                    product_id: product.id,
                    product_name: product.name,
                    product_code: product.code,
                    spec: product.spec,
                    unit: product.unit,
                  });
                }
                setActiveDropdownIndex(null);
                setDropdownProducts([]);
              }}
              onClose={() => {
                setActiveDropdownIndex(null);
                setDropdownProducts([]);
                setDropdownRect(null);
              }}
              width="100%"
            />
          </div>
        )}

      {isAddNewProductClicked && (
        <ProductDetail
          productId={null}
          onClose={() => setIsAddNewProductClicked(false)}
          onSuccess={(productId) => {
            handleNewProductAdded(productId);
            setIsAddNewProductClicked(false);
          }}
        />
      )}
      {selectedProductDetailId && (
        <ProductDetail
          productId={selectedProductDetailId}
          onClose={() => setSelectedProductDetailId(null)}
        />
      )}
    </>
  );
};

export default RequestInfo;
