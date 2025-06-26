interface QuotationHistoryItemProps {
  onClick: () => void;
  clientName: string;
  quantity: number;
  unitPrice: number;
}

const QuotationHistoryItem = ({
  onClick,
  clientName,
  quantity,
  unitPrice,
}: QuotationHistoryItemProps) => {
  return (
    <div
      className="flex items-center h-14 border-b border-[#eeeeee] Me_Body-1 cursor-pointer hover:bg-bg transition-colors duration-200 group"
      onClick={onClick}
    >
      <p className="flex-1 px-3 text-dg truncate" title={clientName}>
        {clientName}
      </p>
      <p className="flex-1 px-3 text-dg">{quantity.toLocaleString()}</p>
      <p className="flex-1 px-3 text-dg">{unitPrice.toLocaleString()}</p>
      <p className="flex-1 px-3 text-dg">
        {(quantity * unitPrice).toLocaleString()}
      </p>
      <p className="Re_Body-1 text-gr px-3 group-hover:opacity-100 opacity-0 transition-opacity duration-200">
        상세보기
      </p>
    </div>
  );
};

export default QuotationHistoryItem;
