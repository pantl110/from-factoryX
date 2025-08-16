import { ProductResponseModel } from '@/types/data-model';

interface ReturnTableItemProps {
  productDetail: ProductResponseModel;
}

const ReturnTableItem = ({ productDetail }: ReturnTableItemProps) => {
  return (
    <div className="flex items-center h-14 border-b border-lg Me_Body-1 text-dg">
      <p className="flex-[2] py-1 px-3 truncate" title={productDetail?.name}>
        {productDetail?.name}
      </p>
      <p className="flex-1 py-1 px-3 truncate" title={productDetail?.code}>
        {productDetail?.code}
      </p>
      <p className="flex-1 py-1 px-3 truncate" title={productDetail?.spec}>
        {productDetail?.spec || '-'}
      </p>
      <p className="w-[80px] py-1 px-3 truncate">
        {productDetail?.unit || '-'}
      </p>
    </div>
  );
};

export default ReturnTableItem;
