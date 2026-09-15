import NoHistoryBox from '@/ui/no-history-box';
import TableItem from './table-item';
import ProductDetail from '@/app/[locale]/(with-layout)/stock/product/product-detail';
import {
  FormProvider,
  useForm,
  useFieldArray,
  useWatch,
} from 'react-hook-form';
import {
  useImperativeHandle,
  forwardRef,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useGetProduct } from '@/hooks';
import useMemberStore from '@/store/member-store';
import { useTranslations } from 'next-intl';
import { TaxType } from '@/types/status-type';
import { calculateTaxLineAmounts } from '@/utils/tax-calculation';

// 세금계산서 편집용 제품 데이터 타입
interface TaxProductEditModel {
  productId: number;
  quantity: number;
  unit_price: number;
  product_name: string;
  product_code: string;
  product_spec: string;
  tax_type?: Exclude<TaxType, 'unclassified' | 'mixed'>;
  tax_type_review_required?: boolean;
}

interface ProductInfoProps {
  setIsProductDetailOpen: (isOpen: boolean) => void;
  isProductDetailOpen: boolean;
  onFormChange?: (
    isDirty: boolean,
    isValid: boolean,
    formData: ProductFormDataModel
  ) => void;
  initialProducts?: TaxProductEditModel[];
  overrideTaxType?: Exclude<TaxType, 'unclassified' | 'mixed'>;
}

export interface ProductFormDataModel {
  products: Array<{
    productId: number;
    quantity: number;
    unitPrice: number;
    product_name?: string;
    product_code?: string;
    product_spec?: string;
    tax_type?: Exclude<TaxType, 'unclassified' | 'mixed'>;
    tax_type_review_required?: boolean;
  }>;
}

export interface ProductInfoRefModel {
  addProduct: () => void;
}

const normalizeTaxType = (
  productTaxType?: TaxType
): Exclude<TaxType, 'unclassified' | 'mixed'> | undefined => {
  if (productTaxType === 'taxable' || productTaxType === 'exempt') {
    return productTaxType;
  }
  if (productTaxType === 'zero_rated') return 'zero_rated';
  return undefined;
};

const isProductFormValid = (products: ProductFormDataModel['products']) =>
  products.length > 0 &&
  products.every(
    (product) =>
      product.productId > 0 &&
      product.quantity > 0 &&
      product.unitPrice > 0 &&
      Boolean(product.tax_type) &&
      !product.tax_type_review_required
  );

const ProductInfo = forwardRef<ProductInfoRefModel, ProductInfoProps>(
  (
    {
      setIsProductDetailOpen,
      isProductDetailOpen,
      onFormChange,
      initialProducts,
      overrideTaxType,
    },
    ref
  ) => {
    const role = useMemberStore((state) => state.role);
    const isViewer = role === 'viewer';
    const t = useTranslations('tax.createTaxPanel.productInfo');
    const tCommon = useTranslations('common');

    const { getProductDetail } = useGetProduct();

    const methods = useForm<ProductFormDataModel>({
      defaultValues: {
        products: [],
      },
    });

    // 임시 문서를 다시 열 때 저장 당시 스냅샷을 먼저 복원한 뒤,
    // 연결된 제품 마스터의 최신 과세 구분을 다시 적용한다.
    useEffect(() => {
      if (!initialProducts || initialProducts.length === 0) return;

      let isCancelled = false;
      const restoredProducts = initialProducts.map((product) => ({
        productId: product.productId,
        quantity: product.quantity,
        unitPrice: product.unit_price, // snake_case → camelCase로 매핑
        product_name: product.product_name,
        product_code: product.product_code,
        product_spec: product.product_spec,
        tax_type: normalizeTaxType(product.tax_type),
        tax_type_review_required: product.tax_type_review_required,
      }));

      methods.reset({ products: restoredProducts });

      const syncTaxTypesFromProductMaster = async () => {
        const masterTaxTypes = await Promise.all(
          restoredProducts.map(async (product) => {
            if (!product.productId) return product;

            const result = await getProductDetail(product.productId);
            if (!result.success || !result.data) return product;
            return {
              ...product,
              tax_type: result.data.tax_type_review_required
                ? undefined
                : normalizeTaxType(result.data.tax_type),
              tax_type_review_required:
                result.data.tax_type_review_required ?? false,
            };
          })
        );

        if (isCancelled) return;

        let hasTaxTypeChanges = false;
        masterTaxTypes.forEach((masterProduct, index) => {
          if (
            masterProduct.tax_type === restoredProducts[index].tax_type &&
            masterProduct.tax_type_review_required ===
              restoredProducts[index].tax_type_review_required
          )
            return;

          hasTaxTypeChanges = true;
          methods.setValue(
            `products.${index}.tax_type`,
            masterProduct.tax_type,
            { shouldDirty: true, shouldValidate: true }
          );
          methods.setValue(
            `products.${index}.tax_type_review_required`,
            masterProduct.tax_type_review_required,
            { shouldDirty: false, shouldValidate: true }
          );
        });

        if (hasTaxTypeChanges) {
          await methods.trigger('products');
        }
      };

      void syncTaxTypesFromProductMaster();

      return () => {
        isCancelled = true;
      };
    }, [getProductDetail, initialProducts, methods]);

    const { fields, append, remove } = useFieldArray({
      control: methods.control,
      name: 'products',
    });
    const watchedProducts = useWatch({
      control: methods.control,
      name: 'products',
    });
    const [taxTypeFilter, setTaxTypeFilter] = useState<
      'all' | 'taxable' | 'exempt' | 'unclassified'
    >('all');
    const effectiveTaxTypes = (watchedProducts ?? []).map(
      (product) => overrideTaxType ?? product.tax_type
    );
    const taxableCount = effectiveTaxTypes.filter(
      (taxType) => taxType === 'taxable' || taxType === 'zero_rated'
    ).length;
    const exemptCount = effectiveTaxTypes.filter(
      (taxType) => taxType === 'exempt'
    ).length;
    const reviewRequiredCount = (watchedProducts ?? []).filter(
      (product) => !product.tax_type || product.tax_type_review_required
    ).length;
    const totals = useMemo(
      () =>
        (watchedProducts ?? []).reduce(
          (sum, product) => {
            const lineAmounts = calculateTaxLineAmounts(
              product.quantity,
              product.unitPrice,
              overrideTaxType ?? product.tax_type
            );
            return {
              supplyAmount: sum.supplyAmount + lineAmounts.supplyAmount,
              taxAmount: sum.taxAmount + lineAmounts.taxAmount,
              totalAmount: sum.totalAmount + lineAmounts.totalAmount,
            };
          },
          { supplyAmount: 0, taxAmount: 0, totalAmount: 0 }
        ),
      [overrideTaxType, watchedProducts]
    );

    // 배열 내부의 과세 구분 변경까지 감지해 상위 문서 유형과 저장 상태를 갱신한다.
    useEffect(() => {
      if (!onFormChange) return;

      const products = watchedProducts ?? [];
      onFormChange(methods.formState.isDirty, isProductFormValid(products), {
        products,
      });
    }, [methods.formState.isDirty, onFormChange, watchedProducts]);

    const handleRemoveProduct = (index: number) => {
      remove(index);
    };

    // 상위 컴포넌트에서 호출할 수 있는 메서드들
    useImperativeHandle(ref, () => ({
      addProduct: () => {
        append({
          productId: 0,
          quantity: 0,
          unitPrice: 0,
        });
      },
    }));

    return (
      <FormProvider {...methods}>
        <div>
          {fields.length === 0 ? (
            <NoHistoryBox title={t('empty.title')} text={t('empty.text')} />
          ) : (
            <>
              <div className="mb-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setTaxTypeFilter('all')}
                  className={`rounded-md px-3 py-2 Me_Body-3 ${
                    taxTypeFilter === 'all'
                      ? 'bg-primary text-wh'
                      : 'bg-bg text-sv'
                  }`}
                >
                  {tCommon('all')} {fields.length}
                </button>
                <button
                  type="button"
                  onClick={() => setTaxTypeFilter('taxable')}
                  className={`rounded-md px-3 py-2 Me_Body-3 ${
                    taxTypeFilter === 'taxable'
                      ? 'bg-primary text-wh'
                      : 'bg-blue-8 text-primary'
                  }`}
                >
                  {tCommon('taxable')} {taxableCount}
                </button>
                <button
                  type="button"
                  onClick={() => setTaxTypeFilter('exempt')}
                  className={`rounded-md px-3 py-2 Me_Body-3 ${
                    taxTypeFilter === 'exempt'
                      ? 'bg-secondary text-bl'
                      : 'bg-bg text-sv'
                  }`}
                >
                  {tCommon('taxExempt')} {exemptCount}
                </button>
                <button
                  type="button"
                  onClick={() => setTaxTypeFilter('unclassified')}
                  className={`rounded-md px-3 py-2 Me_Body-3 ${
                    taxTypeFilter === 'unclassified'
                      ? 'bg-red text-wh'
                      : 'bg-red-4 text-red'
                  }`}
                >
                  {tCommon('taxTypeReviewRequired')} {reviewRequiredCount}
                </button>
              </div>
              <div className="flex items-center h-12 border-t border-b border-lg Me_Body-3 cursor-default">
                <p className="flex-1 py-1 px-3 text-sv">
                  {tCommon('productName')}
                </p>
                <p className="flex-1 py-1 px-3 text-sv">
                  {tCommon('productCode')}
                </p>
                <p className="flex-1 py-1 px-3 text-sv">
                  {tCommon('specification')}
                </p>
                <p className="w-[90px] py-1 px-3 text-sv">
                  {tCommon('taxClassification')}
                </p>
                <p className="flex-1 py-1 px-3 text-sv">
                  {tCommon('quantity')}
                </p>
                <p className="w-[100px] py-1 px-3 text-sv">
                  {tCommon('unitPrice')}
                </p>
                <p className="w-[110px] py-1 px-3 text-sv text-right">
                  {tCommon('supplyAmount')}
                </p>
                <p className="w-[100px] py-1 px-3 text-sv text-right">
                  {tCommon('taxAmount')}
                </p>
                <p className="w-[110px] py-1 px-3 text-sv text-right">
                  {tCommon('totalAmount')}
                </p>
                {!isViewer && <div className="w-9" />}
              </div>

              {fields.map((field, index) => {
                const rowTaxType = effectiveTaxTypes[index];
                const normalizedTaxType =
                  rowTaxType === 'zero_rated' ? 'taxable' : rowTaxType;
                const isRowReviewRequired =
                  !rowTaxType ||
                  watchedProducts?.[index]?.tax_type_review_required;
                if (
                  taxTypeFilter !== 'all' &&
                  (taxTypeFilter === 'unclassified'
                    ? !isRowReviewRequired
                    : normalizedTaxType !== taxTypeFilter)
                ) {
                  return null;
                }
                return (
                  <TableItem
                    key={field.id}
                    index={index}
                    onRemove={() => handleRemoveProduct(index)}
                    overrideTaxType={overrideTaxType}
                  />
                );
              })}
              <div className="flex items-center h-12 border-b border-lg bg-bg Me_Body-3">
                <p className="flex-1 px-3 text-dg">{tCommon('total')}</p>
                <div className="flex-1" />
                <div className="flex-1" />
                <div className="w-[90px]" />
                <div className="flex-1" />
                <div className="w-[100px]" />
                <p className="w-[110px] px-3 text-dg text-right">
                  {totals.supplyAmount.toLocaleString()}
                </p>
                <p className="w-[100px] px-3 text-dg text-right">
                  {totals.taxAmount.toLocaleString()}
                </p>
                <p className="w-[110px] px-3 text-dg text-right">
                  {totals.totalAmount.toLocaleString()}
                </p>
                {!isViewer && <div className="w-9" />}
              </div>
            </>
          )}
        </div>

        {isProductDetailOpen && (
          // 제품 생성 용도
          <ProductDetail
            productId={null}
            onClose={() => setIsProductDetailOpen(false)}
            onSuccess={async (productId) => {
              // 새로운 제품 생성 성공 시 해당 제품 정보를 조회하여 폼에 추가
              if (productId) {
                try {
                  const result = await getProductDetail(productId);
                  if (result.success && result.data) {
                    append({
                      productId,
                      quantity: 0,
                      unitPrice: 0,
                      product_name: result.data.name,
                      product_code: result.data.code,
                      product_spec: result.data.spec,
                      tax_type: result.data.tax_type_review_required
                        ? undefined
                        : result.data.tax_type,
                      tax_type_review_required:
                        result.data.tax_type_review_required ?? false,
                    });
                  }
                } catch {
                  // 조회 실패 시에도 기본 정보로 추가
                  append({
                    productId,
                    quantity: 0,
                    unitPrice: 0,
                  });
                }
              }
              setIsProductDetailOpen(false);
            }}
          />
        )}
      </FormProvider>
    );
  }
);

ProductInfo.displayName = 'ProductInfo';

export default ProductInfo;
