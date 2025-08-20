interface ProductionTableItemProps {
  productName: string;
  spec: string;
  unit: string;
  productionQuantity: number;
  machine: string;
  productionTime: number | null;
}

const ProductionTableItem = ({
  productName,
  spec,
  unit,
  productionQuantity,
  machine,
  productionTime,
}: ProductionTableItemProps) => {
  return (
    <div className="w-full py-[15px] flex items-start Me_Body-1 text-dg border-b border-lg print-row-48">
      <p className="flex-2 px-3 print-break">{productName}</p>
      <p className="flex-1 px-3">{spec}</p>
      <p className="w-[80px] px-3">{unit}</p>
      <p className="flex-1 px-3">{productionQuantity.toLocaleString()}</p>
      <p className="flex-[0.8] px-3">{machine}</p>
      <p className="flex-[0.8] px-3">
        {productionTime ? productionTime.toLocaleString() : '-'}초
      </p>
    </div>
  );
};

export default ProductionTableItem;
