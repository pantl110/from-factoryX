import React from "react";

interface ProductItemProps {
  productName: string;
  productCode: string;
  specification: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
}

const ProductItem = ({
  productName,
  productCode,
  specification,
  unit,
  quantity,
  unitPrice,
  totalPrice,
}: ProductItemProps) => {
  return (
    <div className="w-full h-14 flex items-center Me_Body-1 text-dg border-b border-[#eeeeee]">
      <p className="flex-1 px-3 truncate" title={productName}>
        {productName}
      </p>
      <p className="flex-1 px-3">{productCode}</p>
      <p className="flex-1 px-3">{specification}</p>
      <p className="w-[80px] px-3">{unit}</p>
      <p className="w-[100px] px-3">{quantity}</p>
      <p className="flex-1 px-3">{unitPrice}</p>
      <p className="flex-1 px-3">{totalPrice}</p>
    </div>
  );
};

export default ProductItem;
