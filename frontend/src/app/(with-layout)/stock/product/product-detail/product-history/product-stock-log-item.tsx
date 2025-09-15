interface ProductStockLogItemProps {
  date: string;
  status: 'in' | 'out';
  amount: number;
  total?: number;
}

const ProductStockLogItem = ({
  date,
  status,
  amount,
  total,
}: ProductStockLogItemProps) => {
  const getTypeColor = (status: 'in' | 'out') => {
    switch (status) {
      case 'in':
        return 'text-primary';
      case 'out':
        return 'text-red';
      default:
        return 'text-dg';
    }
  };

  const getAmountDisplay = (status: 'in' | 'out', amount: number) => {
    const sign = status === 'in' ? '+' : '-';
    return `${sign}${amount.toLocaleString()}`;
  };

  return (
    <div className="flex items-center h-14 border-b border-lg Me_Body-1">
      <p className="w-[150px] px-3 text-dg">{date}</p>
      <p className={`w-[150px] px-3 ${getTypeColor(status)}`}>
        {status === 'in' ? '입고' : '출고'}
      </p>
      <p className={`flex-1 px-3 ${getTypeColor(status)}`}>
        {getAmountDisplay(status, amount)}
      </p>
      <p className="flex-1 px-3 text-dg">
        {total ? total.toLocaleString() : '-'}
      </p>
    </div>
  );
};

export default ProductStockLogItem;
