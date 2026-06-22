import { MaterialHistoryResponseModel } from '@/types/data-model';
import { formatISODate } from '@/utils';
import SelectableTableRow from './selectable-table-row';

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
    <SelectableTableRow isSelected={isSelected} onClick={onItemClick}>
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
    </SelectableTableRow>
  );
};
export default LinkModalTaxTableItem;
