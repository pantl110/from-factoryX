interface MaterialStockLogItemProps {
  date: string;
  status: string;
  quantity: number;
  productName: string;
  currentStock: number;
}

const MaterialStockLogItem = ({
  date,
  status,
  quantity,
  productName,
  currentStock,
}: MaterialStockLogItemProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "생산 투입":
        return "text-red";
      case "원자재 입고":
        return "text-primary";
      default:
        return "text-dg";
    }
  };

  const getQuantityDisplay = (status: string, quantity: number) => {
    const sign = status === "생산 투입" ? "-" : "+";
    return `${sign}${quantity.toLocaleString()}`;
  };

  return (
    <div className="flex items-center h-14 border-b border-[#eeeeee] Me_Body-1">
      <p className="w-[150px] px-3 text-dg">{date}</p>
      <p className={`w-[150px] px-3 ${getStatusColor(status)}`}>{status}</p>
      <p className={`flex-1 px-3 ${getStatusColor(status)}`}>
        {getQuantityDisplay(status, quantity)}
      </p>
      <p className="flex-1 px-3 text-dg">{productName}</p>
      <p className="flex-1 px-3 text-dg">{currentStock.toLocaleString()}</p>
    </div>
  );
};

export default MaterialStockLogItem;
