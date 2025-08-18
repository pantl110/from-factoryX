'use client';

import { TodayProductionPlanModel } from '../type';
import { useRouter } from 'next/navigation';

export interface ProductionTableItemProps {
  item: TodayProductionPlanModel;
}

const ProductionTableItem = ({ item }: ProductionTableItemProps) => {
  const router = useRouter();

  // 날짜를 MM/DD HH:mm 형식으로 변환
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  };

  return (
    <div
      onClick={() => {
        router.push(`/production/${item.project_id}`);
      }}
      className="flex min-w-[1324px] h-14 items-center Me_Body-1 text-dg border-b border-lg cursor-pointer hover:bg-bg transition-colors ease-in-out duration-200"
    >
      <p className="px-3 flex-2 truncate" title={item.company_name}>
        {item.company_name}
      </p>
      <p className="px-3 flex-2 truncate" title={item.product_name}>
        {item.product_name}
      </p>
      <p className="px-3 flex-[1.5] truncate" title={item.product_code}>
        {item.product_code}
      </p>
      <p className="px-3 flex-1 truncate" title={item.spec}>
        {item.spec}
      </p>
      <p className="px-3 w-[80px] truncate" title={item.unit}>
        {item.unit}
      </p>
      <p
        className="flex items-center px-3 flex-1 truncate"
        title={item.production_quantity.toLocaleString()}
      >
        {item.production_quantity.toLocaleString()}
      </p>
      <p
        className="flex items-center px-3 flex-[1.5] truncate"
        title={item.equipment_name}
      >
        {item.equipment_name}
      </p>
      <p className="px-3 flex-2">
        {formatDate(item.start_date)} - {formatDate(item.end_date)}
      </p>
    </div>
  );
};

export default ProductionTableItem;
