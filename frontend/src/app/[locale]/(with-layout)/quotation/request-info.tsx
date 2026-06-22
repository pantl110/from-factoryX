import MiniBtn from '@/ui/mini-btn';
import ProductItem from './product-item';
import { CaretDown } from '@phosphor-icons/react/dist/ssr';
import { useGetDetailQuotation, useGetProduct } from '@/hooks';
import { useEffect, useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  QuotationProductDetailResponseModel,
  ProductResponseModel,
  OcrRequestItemModel,
  ProjectStatusType,
} from '@/types/data-model';
import ProductEnrollmentDropdown from './modals/product-enrollment-dropdown';
import ProductDetail from '../stock/product/product-detail';
import { ProductNameDropdown } from '@/ui/dropdown/product-name-dropdown';
import PriceInfo from '@/ui/price-info';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { useTranslations } from 'next-intl';
import { normalizeForMatch } from '@/utils';

interface RequestInfoProps {
  onProductClick: (productId: number) => void;
  setHasQuotationProducts: (hasQuotationProducts: boolean) => void;
  onProductsChange?: (products: QuotationProductDetailResponseModel[]) => void;
  quotationId?: number;
  ocrRequestData?: OcrRequestItemModel[];
  productList?: ProductResponseModel[];
  onOcrUnmatchedProducts?: () => void;
  projectStatus: ProjectStatusType;
}

const RequestInfo = ({
  onProductClick,
  setHasQuotationProducts,
  onProductsChange,
  quotationId,
  ocrRequestData,
  productList,
  onOcrUnmatchedProducts,
  projectStatus,
}: RequestInfoProps) => {
  const tCommon = useTranslations('common');
  const tRequestInfo = useTranslations('quotation.requestInfo');
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  const [isProductEnrollmentDropdownOpen, setIsProductEnrollmentDropdownOpen] =
    useState(false);
  const [isAddNewProductClicked, setIsAddNewProductClicked] = useState(false);
  const [selectedProductDetailId, setSelectedProductDetailId] = useState<
    number | null
  >(null);
  const [supplyAmount, setSupplyAmount] = useState<number>(0);

  // hook을 항상 호출하되, quotationId가 없으면 0을 전달
  const { data: quotationDetail } = useGetDetailQuotation(
    quotationId && quotationId > 0 ? quotationId : 0
  );
  const { getProductDetail } = useGetProduct();

  // React Hook Form 설정
  const { control, reset } = useForm({
    defaultValues: {
      products: [] as QuotationProductDetailResponseModel[],
    },
  });

  // reset 함수의 최신 참조를 유지하기 위한 ref
  const resetRef = useRef(reset);
  resetRef.current = reset;

  // 드롭다운 상태를 상위에서 관리
  const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(
    null
  );
  const [dropdownSearchTerm, setDropdownSearchTerm] = useState('');
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);

  const { fields, update, append, remove } = useFieldArray({
    control,
    name: 'products',
  });

  // quotationDetail.products가 변경될 때마다 폼 필드 업데이트
  useEffect(() => {
    if (quotationDetail?.products && quotationDetail.products.length > 0) {
      // reset을 사용해서 폼을 완전히 초기화
      resetRef.current({ products: quotationDetail.products });

      // 상위 컴포넌트에 제품 목록 전달
      onProductsChange?.(quotationDetail.products);
    }
  }, [quotationDetail?.products, onProductsChange]);

  // OCR 데이터가 있을 때 제품 목록 초기화
  useEffect(() => {
    if (ocrRequestData && ocrRequestData.length > 0) {
      const parseNumber = (val?: string | number | null) => {
        if (val === null || val === undefined) return null;
        if (typeof val === 'number') return val;

        // 쉼표(,)만 제거하고 소수점(.)은 유지해서
        // "100.0" -> 100, "5,040.00" -> 5040 으로 파싱되도록 처리
        const normalized = val.toString().replace(/,/g, '').trim();
        if (!normalized) return null;

        const num = parseFloat(normalized);
        return Number.isNaN(num) ? null : num;
      };

      // OCR 데이터로 제품 목록 생성
      const ocrProducts = ocrRequestData.map((item: OcrRequestItemModel) => {
        // 1단계: 품목코드로 기존 제품 찾기 (양쪽 정규화 후 비교)
        let existingProduct = productList?.find(
          (p) => normalizeForMatch(p.code) === normalizeForMatch(item.item_code)
        );

        // 2단계: 없으면 제품명으로 후보 조회 (정확히 1개일 때만 매칭)
        if (!existingProduct && productList) {
          const byName = productList.filter(
            (p) =>
              normalizeForMatch(p.name) === normalizeForMatch(item.item_name)
          );
          if (byName.length === 1) {
            existingProduct = byName[0];
          }
        }

        const { id: productId, code, name, spec, unit } = existingProduct || {};
        return {
          productId: productId ?? null,
          product_code: code ?? '',
          product_name: name ?? '',
          spec: spec ?? '',
          unit: unit ?? '',
          quantity: parseNumber(item.quantity),
          unit_price: parseNumber(item.unit_price),
          supply_amount: null,
          tax_amount: null,
        };
      });

      // 폼 초기화
      resetRef.current({ products: ocrProducts });

      // 상위 컴포넌트에 제품 목록 전달
      onProductsChange?.(ocrProducts);

      // 제품 정보가 비어 있는 행이 하나라도 있으면 안내 콜백
      const hasUnmatched = ocrProducts.some(
        (p) => !p.productId || !p.product_code
      );
      if (hasUnmatched) {
        onOcrUnmatchedProducts?.();
      }
    }
  }, [ocrRequestData, productList, onProductsChange, onOcrUnmatchedProducts]);

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
    const updatedField = {
      ...currentField,
      [field]: numericValue,
    };

    update(index, updatedField);

    // 부모 컴포넌트에 변경사항 알림 (최신 상태 사용)
    if (onProductsChange) {
      const updatedFields = fields.map((field, i) =>
        i === index ? updatedField : field
      );
      onProductsChange(updatedFields);
    }
  };

  // 품목 삭제
  const handleDeleteProduct = (index: number) => {
    remove(index);

    // 부모 컴포넌트에 변경사항 알림
    if (onProductsChange) {
      const updatedFields = fields.filter((_, i) => i !== index);
      onProductsChange(updatedFields);
    }
  };

  // 기존 품목 추가 시 빈 품목 추가
  const handleAddEmptyProduct = () => {
    const emptyProduct: QuotationProductDetailResponseModel = {
      productId: null,
      product_name: '',
      product_code: '',
      spec: '',
      unit: '',
      quantity: null,
      unit_price: null,
      supply_amount: null,
      tax_amount: null,
    };

    // append로 새 필드 추가
    append(emptyProduct);
  };

  // 새로운 품목 추가 시 품목 디테일 판넬에서 저장버튼 누르면
  const handleNewProductAdded = async (productId?: number) => {
    if (productId) {
      const productDetail = await getProductDetail(productId);

      // 새로운 품목을 form에 추가
      const newProduct: QuotationProductDetailResponseModel = {
        productId,
        product_name: productDetail?.data?.name || '-',
        product_code: productDetail?.data?.code || '-',
        spec: productDetail?.data?.spec || '-',
        unit: productDetail?.data?.unit || '-',
        quantity: null,
        unit_price: null,
        supply_amount: null,
        tax_amount: null,
      };

      append(newProduct);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center relative">
        <h3 className="Heading-3">
          {projectStatus === 'confirmed'
            ? tRequestInfo('orderTitle')
            : tRequestInfo('title')}
        </h3>
        <MiniBtn variant="outline"
          text={tRequestInfo('addProduct')}
          icon={CaretDown}
          iconPosition="right"
          onClick={() => setIsProductEnrollmentDropdownOpen(true)}
          disabled={isViewer || !hasSubscription()}
        />
        {/* 제품 추가하기 드롭다운 */}
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

      {fields.length > 0 ? (
        <>
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[938px]">
              <thead>
                <tr className="flex items-center h-12 border-t border-b border-lg Me_Body-3 text-sv rounded-sm">
                  <th className="text-left px-3 flex-[1.5]">
                    {tCommon('productName')}
                  </th>
                  <th className="text-left px-3 flex-1">
                    {tCommon('productCode')}
                  </th>
                  <th className="text-left px-3 flex-1">
                    {tCommon('specification')}
                  </th>
                  <th className="text-left px-3 flex-1">
                    {tCommon('manufacturingQuantity')}
                  </th>
                  <th className="text-left px-3 flex-[0.8]">
                    {tCommon('unit')}
                  </th>
                  <th className="text-left px-3 flex-1">
                    {tCommon('unitPrice')}
                  </th>
                  <th className="text-left px-3 flex-1">{tCommon('amount')}</th>
                  {!isViewer && hasSubscription() && <th className="w-9" />}
                </tr>
              </thead>
              <tbody>
                {/* 사용자가 입력한 formData (요청 정보) 표시 */}
                {fields.map((item, index) => {
                  return (
                    <ProductItem
                      key={index}
                      data={item}
                      onClick={() => onProductClick(item.productId || 0)}
                      canDelete={true}
                      onChange={(field, value) => {
                        handleQuantityOrPriceChange(index, field, value);
                      }}
                      onDelete={() => handleDeleteProduct(index)}
                      onDropdownShow={(searchTerm, rect) => {
                        setActiveDropdownIndex(index);
                        setDropdownSearchTerm(searchTerm);
                        setDropdownRect(rect || null);
                      }}
                      onDropdownHide={() => {
                        setActiveDropdownIndex(null);
                        setDropdownSearchTerm('');
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
          <div className="mb-22 w-full flex justify-between items-center">
            <PriceInfo
              supplyAmount={supplyAmount}
              taxAmount={supplyAmount * 0.1}
              textColor="text-blue"
            />
          </div>
        </>
      ) : (
        <div className="py-8 h-full flex flex-col justify-center items-center gap-2 rounded-[4px] border border-lg mb-22">
          <h4 className="Heading-4 text-dg">{tRequestInfo('empty.title')}</h4>
          <p className="R_Body-1 text-gr">
            {tRequestInfo('empty.description')}
          </p>
        </div>
      )}

      {/* 포털 드롭다운 */}
      {activeDropdownIndex !== null && dropdownSearchTerm && dropdownRect && (
        <div
          className="fixed z-10"
          style={{
            top: `${dropdownRect.bottom + 16}px`,
            left: `${dropdownRect.left - 0}px`,
            width: `${dropdownRect.width - 1}px`,
          }}
        >
          <ProductNameDropdown
            searchTerm={dropdownSearchTerm}
            onSelect={(product: ProductResponseModel) => {
              // 선택된 품목 정보로 해당 행 업데이트
              if (activeDropdownIndex !== null) {
                const updatedProduct = {
                  ...fields[activeDropdownIndex],
                  productId: product.id,
                  product_name: product.name,
                  product_code: product.code,
                  spec: product.spec,
                  unit: product.unit,
                };
                update(activeDropdownIndex, updatedProduct);

                // 부모 컴포넌트에 변경사항 알림
                if (onProductsChange) {
                  const updatedFields = [...fields];
                  updatedFields[activeDropdownIndex] = updatedProduct;
                  onProductsChange(updatedFields);
                }
              }
              setActiveDropdownIndex(null);
              setDropdownSearchTerm('');
            }}
            onClose={() => {
              setActiveDropdownIndex(null);
              setDropdownSearchTerm('');
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
