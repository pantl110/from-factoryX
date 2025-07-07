interface ProductionTableItemProps {
  productName: string;
  standard: string;
  unit: string;
  productionQuantity: number;
  machine: string;
  productionTime: string;
}

const ProductionTableItem = ({
  productName,
  standard,
  unit,
  productionQuantity,
  machine,
  productionTime,
}: ProductionTableItemProps) => {
  return (
    <div className="w-full h-14 flex items-center Me_Body-1 text-dg border-b border-[#eeeeee] print-row-48">
      <p className="flex-2 px-3 truncate print-break" title={productName}>
        {productName}
      </p>
      <p className="flex-1 px-3 truncate" title={standard}>
        {standard}
      </p>
      <p className="w-[80px] px-3" >
        {unit}
      </p>
      <p className="flex-1 px-3">
        {productionQuantity.toLocaleString()}
      </p>
      <p className="flex-[0.8] px-3">
        {machine}
      </p>
      <p className="flex-[0.8] px-3">
        {productionTime}
      </p>
    </div>
  );
};

export default ProductionTableItem;
