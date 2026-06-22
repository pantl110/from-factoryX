interface HistoryItemProps {
  date: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// 날짜를 MM/DD 형식으로 포맷팅하는 함수
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}`;
};

const HistoryItem = ({
  date,
  productName,
  quantity,
  unitPrice,
  totalPrice,
}: HistoryItemProps) => {
  return (
    <div className="flex items-center w-full h-14 Me_Body-3 text-dg border-b border-lg">
      <p className="flex-[1.2] py-1 px-3 truncate" title={date}>
        {formatDate(date)}
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
