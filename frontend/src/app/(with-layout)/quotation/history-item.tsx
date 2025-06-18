interface HistoryItemProps {
  productName: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
}

const HistoryItem = ({
  productName,
  quantity,
  unitPrice,
  totalPrice,
}: HistoryItemProps) => {
  return (
    <div className="flex items-center w-full h-14 Me_Body-1 text-dg border-b border-[#eeeeee]">
      <p className="flex-[2] py-1 px-3 truncate" title={productName}>
        {productName}
      </p>
      <p className="w-[100px] py-1 px-3 ">{quantity}</p>
      <p className="flex-1 py-1 px-3 ">{unitPrice}</p>
      <p className="flex-1 py-1 px-3 ">{totalPrice}</p>
    </div>
  );
};

export default HistoryItem;
