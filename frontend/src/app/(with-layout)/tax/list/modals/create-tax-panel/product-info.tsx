import NoHistoryBox from '@/ui/no-history-box';
import TableItem from './table-item';
import ProductDetail from '@/app/(with-layout)/stock/product/product-detail';
import { FormProvider, useForm } from 'react-hook-form';

interface ProductInfoProps {
  setIsProductDetailOpen: (isOpen: boolean) => void;
  isProductDetailOpen: boolean;
}

interface ProductFormData {
  quantity: number;
  unitPrice: number;
}

const ProductInfo = ({
  setIsProductDetailOpen,
  isProductDetailOpen,
}: ProductInfoProps) => {
  const methods = useForm<ProductFormData>({
    defaultValues: {
      quantity: 0,
      unitPrice: 0,
    },
  });

  return (
    <FormProvider {...methods}>
      <div>
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

        <TableItem />

        <NoHistoryBox
          title="품목이 아직 등록되지 않았어요."
          text="선발행된 세금계산서에는 추후 품목이 추가될 수 있어요."
        />
      </div>

      {isProductDetailOpen && (
        <ProductDetail
          productId={null}
          onClose={() => setIsProductDetailOpen(false)}
          onSuccess={() => {
            setIsProductDetailOpen(false);
          }}
        />
      )}
    </FormProvider>
  );
};

export default ProductInfo;
