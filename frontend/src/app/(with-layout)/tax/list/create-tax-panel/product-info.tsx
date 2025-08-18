import NoHistoryBox from '@/ui/no-history-box';
import TableItem from './table-item';
import ProductDetail from '@/app/(with-layout)/stock/product/product-detail';
import { FormProvider, useForm, useFieldArray } from 'react-hook-form';
import { useImperativeHandle, forwardRef, useEffect } from 'react';
import { useGetProduct } from '@/hooks';
import { ProductResponseModel } from '@/types/data-model';

interface ProductInfoProps {
  setIsProductDetailOpen: (isOpen: boolean) => void;
  isProductDetailOpen: boolean;
  onFormChange?: (isDirty: boolean, formData: ProductFormDataModel) => void;
}

export interface ProductFormDataModel {
  products: Array<{
    productId: number;
    quantity: number;
    unitPrice: number;
    productData?: ProductResponseModel; // 품목 정보를 저장할 필드
  }>;
}

export interface ProductInfoRef {
  addProduct: () => void;
}

const ProductInfo = forwardRef<ProductInfoRef, ProductInfoProps>(
  ({ setIsProductDetailOpen, isProductDetailOpen, onFormChange }, ref) => {
    const { getProductDetail } = useGetProduct();

    const methods = useForm<ProductFormDataModel>({
      defaultValues: {
        products: [],
      },
    });

    const { fields, append, remove } = useFieldArray({
      control: methods.control,
      name: 'products',
    });

    // 폼 변경 상태를 상위 컴포넌트로 전달
    useEffect(() => {
      if (onFormChange) {
        const formData = methods.watch();
        onFormChange(methods.formState.isDirty, formData);
      }
    }, [methods.formState.isDirty, onFormChange]);

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
            <NoHistoryBox
              title="품목이 아직 등록되지 않았어요."
              text="선발행된 세금계산서에는 추후 품목이 추가될 수 있어요."
            />
          ) : (
            <>
              <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1">
                <p className="flex-1 py-1 px-3 text-sv">품목명</p>
                <p className="flex-1 py-1 px-3 text-sv">품목 코드</p>
                <p className="flex-1 py-1 px-3 text-sv">규격</p>
                <p className="w-[80px] py-1 px-3 text-sv">단위</p>
                <p className="flex-1 py-1 px-3 text-sv">제작 수량</p>
                <p className="w-[100px] py-1 px-3 text-sv">단가</p>
                <p className="flex-1 py-1 px-3 text-sv">금액</p>
                <div className="w-9" />
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
          // 품목 생성 용도
          <ProductDetail
            productId={null}
            onClose={() => setIsProductDetailOpen(false)}
            onSuccess={async (productId) => {
              // 새로운 품목 생성 성공 시 해당 품목 정보를 조회하여 폼에 추가
              if (productId) {
                try {
                  const result = await getProductDetail(productId);
                  if (result.success && result.data) {
                    append({
                      productId: productId,
                      quantity: 0,
                      unitPrice: 0,
                      productData: result.data, // 품목 정보를 함께 저장
                    });
                  }
                } catch {
                  // 조회 실패 시에도 기본 정보로 추가
                  append({
                    productId: productId,
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
