interface TableItemProps {
  productName: string;
  productCode: string;
  size: string;
  unit: string;
  stock: number;
  onClick: () => void;
  isDeleteMode: boolean;
}

const TableItem = ({
  productName,
  productCode,
  size,
  unit,
  stock,
  onClick,
  isDeleteMode,
}: TableItemProps) => {
  return (
    <div
      className="flex items-center h-14 border-b border-[#eeeeee] Me_Body-1 cursor-pointer hover:bg-bg transition-colors duration-200"
      onClick={onClick}
    >
      {isDeleteMode && (
        <div
          className="flex items-center px-3"
          onClick={(e) => e.stopPropagation()}
        >
          <input type="checkbox" className="w-4 h-4 border-sv" />
        </div>
      )}
      <p className="flex-1 px-3 text-dg">{productName}</p>
      <p className="flex-1 px-3 text-dg">{productCode}</p>
      <p className="flex-1 px-3 text-dg">{size}</p>
      <p className="w-[80px] px-3 text-dg">{unit}</p>
      <p className="flex-1 px-3 text-dg">{stock.toLocaleString()}</p>
    </div>
  );
};

export default TableItem;
