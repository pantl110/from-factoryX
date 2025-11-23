'use client';

import { InventoryStatusColorMap } from '@/types/status-type';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { MaterialResponseModel } from '@/types/data-model';
import { RoundChip, Checkbox } from '@/ui';

interface TableItemProps {
  material: MaterialResponseModel;
  onClick?: () => void;
  checked: boolean;
  onToggle: () => void;
}

const TableItem = ({
  material,
  onClick,
  checked,
  onToggle,
}: TableItemProps) => {
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  const {
    name,
    code,
    unit,
    spec,
    current_stock: currentStock,
    status,
  } = material;
  const colors = status ? InventoryStatusColorMap[status] : null;

  return (
    <>
      <div
        className="flex items-center h-14 border-b border-lg Me_Body-1 cursor-pointer hover:bg-bg transition-colors duration-200"
        onClick={onClick}
      >
        {!isViewer && hasSubscription() && (
          <Checkbox isChecked={checked} onToggle={onToggle} />
        )}
        <p className="flex-1 px-3 text-dg truncate" title={name}>
          {name}
        </p>
        <p className="flex-1 px-3 text-dg truncate" title={code || '-'}>
          {code || '-'}
        </p>
        <p className="flex-1 px-3 text-dg truncate" title={spec}>
          {spec}
        </p>
        <p className="flex-[0.5] px-3 text-dg truncate" title={unit}>
          {unit}
        </p>
        <p
          className="flex-1 px-3 text-dg truncate"
          title={
            typeof currentStock === 'number'
              ? currentStock.toLocaleString()
              : '-'
          }
        >
          {typeof currentStock === 'number'
            ? currentStock.toLocaleString()
            : '-'}
        </p>
        <div className="w-[150px]">
          {status && colors ? (
            <div className="px-2">
              <RoundChip
                text={status}
                variant="sm"
                color={colors.color ?? 'gray'}
              />
            </div>
          ) : (
            <span className="px-3 text-dg">-</span>
          )}
        </div>
      </div>
    </>
  );
};

export default TableItem;
