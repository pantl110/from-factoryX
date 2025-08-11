import { useEffect, useState } from 'react';
import { useGetProduct } from '@/hooks';
import { ProductResponseModel } from '@/types/data-model';

interface ReturnTableItemProps {
  productId: number;
}

const ReturnTableItem = ({ productId }: ReturnTableItemProps) => {
  const [productDetail, setProductDetail] =
    useState<ProductResponseModel | null>(null);
  const { getProductDetail, isLoading } = useGetProduct();

  useEffect(() => {
    const fetchProductDetail = async () => {
      if (!productId) return;
      const result = await getProductDetail(productId);
      if (result.success && result.data) {
        setProductDetail(result.data);
      }
    };

    fetchProductDetail();
  }, [productId, getProductDetail]);

  if (isLoading) {
    return null;
  }

  return (
    <div className="flex items-center h-14 border-b border-lg Me_Body-1 text-dg">
      <p className="flex-[2] py-1 px-3">{productDetail?.name}</p>
      <p className="flex-1 py-1 px-3">{productDetail?.code}</p>
      <p className="flex-1 py-1 px-3">{productDetail?.spec || '-'}</p>
      <p className="w-[80px] py-1 px-3">{productDetail?.unit || '-'}</p>
    </div>
  );
};

export default ReturnTableItem;
