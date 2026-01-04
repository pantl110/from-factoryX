import NoHistoryBox from '@/ui/no-history-box';
import TableItem from './table-item';
import ProductDetail from '@/app/[locale]/(with-layout)/stock/product/product-detail';
import { FormProvider, useForm, useFieldArray } from 'react-hook-form';
import { useImperativeHandle, forwardRef, useEffect } from 'react';
import { useGetProduct } from '@/hooks';
import useMemberStore from '@/store/member-store';
import { useTranslations } from 'next-intl';

// 세금계산서 편집용 제품 데이터 타입
interface TaxProductEditModel {
  productId: number;
  quantity: number;
  unit_price: number;
  product_name: string;
  product_code: string;
  product_spec: string;
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
}

export interface ProductFormDataModel {
  products: Array<{
    productId: number;
    quantity: number;
    unitPrice: number;
    product_name?: string;
    product_code?: string;
    product_spec?: string;
  }>;
}

export interface ProductInfoRefModel {
  addProduct: () => void;
}

const ProductInfo = forwardRef<ProductInfoRefModel, ProductInfoProps>(
  (
    {
      setIsProductDetailOpen,
      isProductDetailOpen,
      onFormChange,
      initialProducts,
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

    // initialProducts가 변경될 때마다 폼 리셋
    useEffect(() => {
      if (initialProducts && initialProducts.length > 0) {
        methods.reset({
          products: initialProducts.map((product) => ({
            productId: product.productId,
            quantity: product.quantity,
            unitPrice: product.unit_price, // snake_case → camelCase로 매핑
            product_name: product.product_name,
            product_code: product.product_code,
            product_spec: product.product_spec,
          })),
        });
      }
    }, [initialProducts, methods]);

    const { fields, append, remove } = useFieldArray({
      control: methods.control,
      name: 'products',
    });

    // 폼 변경 상태를 상위 컴포넌트로 전달
    useEffect(() => {
      if (onFormChange) {
        const subscription = methods.watch((formData) => {
          // 폼 유효성 검사: 모든 필수 필드가 채워져 있는지 확인
          const isValid = Boolean(
            methods.formState.isValid &&
              formData.products &&
              formData.products.length > 0 &&
              formData.products.every(
                (product) =>
                  product &&
                  typeof product.productId === 'number' &&
                  product.productId > 0 &&
                  typeof product.quantity === 'number' &&
                  product.quantity > 0 &&
                  typeof product.unitPrice === 'number' &&
                  product.unitPrice > 0
              )
          );

          onFormChange(
            methods.formState.isDirty,
            isValid,
            formData as ProductFormDataModel
          );
        });
        return () => subscription.unsubscribe();
      }
    }, [methods, onFormChange]);

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
              <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 cursor-default">
                <p className="flex-1 py-1 px-3 text-sv">
                  {tCommon('productName')}
                </p>
                <p className="flex-1 py-1 px-3 text-sv">
                  {tCommon('productCode')}
                </p>
                <p className="flex-1 py-1 px-3 text-sv">
                  {tCommon('specification')}
                </p>
                <p className="flex-1 py-1 px-3 text-sv">
                  {tCommon('manufacturingQuantity')}
                </p>
                <p className="w-[100px] py-1 px-3 text-sv">
                  {tCommon('unitPrice')}
                </p>
                <p className="flex-1 py-1 px-3 text-sv">
                  {tCommon('totalAmount')}
                </p>
                {!isViewer && <div className="w-9" />}
              </div>

              {fields.map((field, index) => (
                <TableItem
                  key={field.id}
                  index={index}
                  onRemove={() => handleRemoveProduct(index)}
                />
              ))}
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
