interface HistoryItemProps {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

const HistoryItem = ({
  productName,
  quantity,
  unitPrice,
  totalPrice,
}: HistoryItemProps) => {
  return (
    <div className="flex items-center w-full h-14 Me_Body-1 text-dg border-b border-[#eeeeee]">
      <p className="flex-2 py-1 px-3 truncate" title={productName}>
        {productName}
      </p>
      <p className="flex-1 py-1 px-3 ">{quantity.toLocaleString()}</p>
      <p className="w-[100px] py-1 px-3 ">{unitPrice.toLocaleString()}</p>
      <p className="flex-1 py-1 px-3 ">{totalPrice.toLocaleString()}</p>
    </div>
  );
};

export default HistoryItem;
