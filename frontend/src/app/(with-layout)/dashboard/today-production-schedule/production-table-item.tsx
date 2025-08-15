import router from 'next/router';

export interface ProductionTableItemProps {
  companyName: string;
  productName: string;
  productCode: string;
  size: string;
  unit: string;
  quantity: number;
  machine: string;
  time: string;
  projectId: number;
}

const ProductionTableItem = ({
  companyName,
  productName,
  productCode,
  size,
  unit,
  quantity,
  machine,
  time,
  projectId,
}: ProductionTableItemProps) => {
  return (
    <div
      onClick={() => {
        router.push(`/production/${projectId}`);
      }}
      className="flex min-w-[1324px] h-14 items-center Me_Body-1 text-dg border-b border-[#eeeeee]"
    >
      <p className="px-3 flex-2 truncate" title={companyName}>
        {companyName}
      </p>
      <p className="px-3 flex-2 truncate" title={productName}>
        {productName}
      </p>
      <p className="px-3 flex-2 truncate" title={productCode}>
        {productCode}
      </p>
      <p className="px-3 flex-1 truncate" title={size}>
        {size}
      </p>
      <p className="px-3 w-[80px] truncate" title={unit}>
        {unit}
      </p>
      <p
        className="flex items-center px-3 flex-1 truncate"
        title={quantity.toLocaleString()}
      >
        {quantity.toLocaleString()}
      </p>
      <p className="flex items-center px-3 flex-2 truncate" title={machine}>
        {machine}
      </p>
      <p className="px-3 w-[200px]" title={time}>
        {time}
      </p>
    </div>
  );
};

export default ProductionTableItem;
