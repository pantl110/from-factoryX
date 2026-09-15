'use client';

import { InventoryStatusColorMap } from '@/types/status-type';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { MaterialResponseModel } from '@/types/data-model';
import { RoundChip, Checkbox } from '@/ui';
import { removeTrailingZeros } from '@/utils';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('stock.material');
  const tCommon = useTranslations('common');
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
    expiry_status: expiryStatus,
    tax_type: taxType,
    tax_type_review_required: isTaxTypeReviewRequired,
  } = material;
  const colors = status ? InventoryStatusColorMap[status] : null;

  // 상태 번역 함수
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      과재고: tCommon('inventoryStatus.overstock'),
      충분: tCommon('inventoryStatus.sufficient'),
      위험: tCommon('inventoryStatus.risk'),
      부족: tCommon('inventoryStatus.shortage'),
    };
    return statusMap[status] || status;
  };

  // 유통기한 상태 번역 함수
  const getExpiryStatusText = (status: string) => {
    if (status === '위험') return t('expiryStatus.risk');
    if (status === '양호') return t('expiryStatus.safe');
    return status;
  };

  return (
    <>
      <div
        className="flex items-center h-14 border-b border-lg Me_Body-3 cursor-pointer hover:bg-bg transition-colors duration-200"
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
        <div className="flex-[0.8] px-3">
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs ${
              taxType === 'exempt'
                ? 'bg-orange-8 text-orange'
                : 'bg-blue-8 text-blue'
            }`}
          >
            {taxType === 'exempt' ? tCommon('taxExempt') : tCommon('taxable')}
          </span>
          {isTaxTypeReviewRequired && (
            <span className="ml-1 text-xs text-red">
              {tCommon('taxTypeReviewRequired')}
            </span>
          )}
        </div>
        <p
          className="flex-1 px-3 text-dg truncate"
          title={
            currentStock !== null && currentStock !== undefined
              ? removeTrailingZeros(currentStock)
              : '-'
          }
        >
          {currentStock !== null && currentStock !== undefined
            ? removeTrailingZeros(currentStock)
            : '-'}
        </p>
        <div className="w-[150px]">
          {status && colors ? (
            <div className="px-2">
              <RoundChip
                text={getStatusText(status)}
                variant="sm"
                color={colors.color ?? 'gray'}
              />
            </div>
          ) : (
            <span className="px-3 text-dg">-</span>
          )}
        </div>
        <div className="w-[150px]">
          {expiryStatus ? (
            <div className="px-2">
              <RoundChip
                text={getExpiryStatusText(expiryStatus)}
                variant="sm"
                color={expiryStatus === '위험' ? 'red' : 'blue'}
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
