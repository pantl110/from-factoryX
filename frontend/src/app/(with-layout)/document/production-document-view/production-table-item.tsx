interface ProductionTableItemProps {
  productName: string;
  standard: string;
  unit: string;
  quantity: number;
  machine: string;
  productionTime: string;
}

const ProductionTableItem = ({
  productName,
  standard,
  unit,
  quantity,
  machine,
  productionTime,
}: ProductionTableItemProps) => {
  return (
    <div className="w-full h-14 flex items-center Me_Body-1 text-dg border-b border-[#eeeeee]">
      <p className="flex-1 px-3 truncate" title={productName}>
        {productName}
      </p>
      <p className="flex-1 px-3">{standard}</p>
      <p className="w-[80px] px-3">{unit}</p>
      <p className="flex-1 px-3">{quantity.toLocaleString()}</p>
      <p className="w-[120px] px-3">{machine}</p>
      <p className="flex-1 px-3">{productionTime}</p>
    </div>
  );
};

export default ProductionTableItem;
