interface HistoryItemProps {
  date: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

const HistoryItem = ({
  date,
  productName,
  quantity,
  unitPrice,
  totalPrice,
}: HistoryItemProps) => {
  return (
    <div className="flex items-center w-full h-14 Me_Body-1 text-dg border-b border-lg">
      <p className="flex-[1.2] py-1 px-3 truncate" title={date}>
        {date}
      </p>
      <p className="flex-2 py-1 px-3 truncate" title={productName}>
        {productName}
      </p>
      <p
        className="flex-1 py-1 px-3 truncate"
        title={quantity.toLocaleString()}
      >
        {quantity.toLocaleString()}
      </p>
      <p
        className="flex-1 py-1 px-3 truncate"
        title={unitPrice.toLocaleString()}
      >
        {unitPrice.toLocaleString()}
      </p>
      <p
        className="flex-[1.3] py-1 px-3 truncate"
        title={totalPrice.toLocaleString()}
      >
        {totalPrice.toLocaleString()}
      </p>
    </div>
  );
};

export default HistoryItem;
