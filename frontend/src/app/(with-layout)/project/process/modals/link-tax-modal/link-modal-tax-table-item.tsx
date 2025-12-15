import { MaterialHistoryResponseModel } from '@/types/data-model';
import { formatISODate } from '@/utils';

interface LinkModalTaxTableItemProps {
  item: MaterialHistoryResponseModel;
  isSelected: boolean;
  onItemClick?: () => void;
}
const LinkModalTaxTableItem = ({
  item,
  isSelected,
  onItemClick,
}: LinkModalTaxTableItemProps) => {
  return (
    <div
      className={`flex items-center h-14 w-full text-bl Me_Body-1 transition-colors duration-200 cursor-pointer ${
        isSelected
          ? 'border border-primary bg-secondary'
          : 'border-b border-lg hover:bg-bg'
      }`}
      onClick={onItemClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onItemClick?.();
      }}
    >
      <p
        className="flex-[1.5] px-3 text-dg truncate"
        title={item.material_name}
      >
        {item.material_name}
      </p>
      <p
        className="flex-1 px-3 text-dg truncate"
        title={item.material_spec || '-'}
      >
        {item.material_spec || '-'}
      </p>
      <p
        className="flex-[0.7] px-3 text-dg truncate"
        title={item.quantity?.toString() || '-'}
      >
        {item.quantity?.toString() || '-'}
      </p>
      <p
        className="flex-[0.5] px-3 text-dg truncate"
        title={item.material_unit || '-'}
      >
        {item.material_unit || '-'}
      </p>
      <p
        className="flex-[0.7] px-3 text-dg truncate"
        title={item.unit_price?.toLocaleString() || '-'}
      >
        {item.unit_price?.toLocaleString() || '-'}
      </p>
      <p
        className="flex-1 px-3 text-dg truncate"
        title={(item.unit_price * item.quantity)?.toLocaleString() || '-'}
      >
        {(item.unit_price * item.quantity)?.toLocaleString() || '-'}
      </p>
      <p
        className="flex-1 px-3 text-dg truncate"
        title={formatISODate(item.date) || '-'}
      >
        {formatISODate(item.date) || '-'}
      </p>
    </div>
  );
};
export default LinkModalTaxTableItem;
