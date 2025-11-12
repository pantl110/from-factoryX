import IconBtn from '@/ui/icon-btn';
import { ArrowLineUpRight, Trash } from '@phosphor-icons/react';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import Chip from '@/ui/chip';
import { MaterialSimpleModel } from '@/types/data-model';

interface SubMaterialItemProps {
  material: MaterialSimpleModel;
}

export const SubMaterialItem = ({ material }: SubMaterialItemProps) => {
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  // 재고 상태 계산 함수
  const getStockStatus = () => {
    const currentStock = material.current_stock ?? 0;
    const standardStock = material.standard_stock ?? 0;

    if (standardStock === 0) {
      return { text: '-', textColor: 'text-dg', bgColor: '' };
    }

    if (currentStock >= standardStock) {
      return {
        text: '충분',
        textColor: 'text-primary',
        bgColor: 'bg-primary-8',
      };
    } else {
      return {
        text: '부족',
        textColor: 'text-red',
        bgColor: 'bg-red-8',
      };
    }
  };

  const stockStatus = getStockStatus();
  const stockQuantity =
    material.current_stock !== null && material.current_stock !== undefined
      ? `${material.current_stock}${material.unit}`
      : '-';

  return (
    <div className="flex items-center h-14 border-b border-lg transition-colors duration-200 ease-in-out Me_Body-1 cursor-default">
      <div
        className="flex-1 px-3 flex items-center justify-between gap-1 min-w-0"
        title={material.name}
      >
        <p className="text-dg truncate">{material.name}</p>
        <IconBtn
          icon={ArrowLineUpRight}
          size="w-9 h-9"
          iconSize={16}
          onClick={() => {}} // TODO: 자재 클릭 핸들러 추가
        />
      </div>
      <p className="flex-1 px-3 text-dg">{material.code}</p>
      <p className="flex-1 px-3 text-dg">{material.spec}</p>
      <p className="flex-1 px-3 text-dg">{material.unit}</p>
      <p className="flex-1 px-3 text-dg">{stockQuantity}</p>

      <div className="flex-1 px-3">
        <Chip
          text={stockStatus.text}
          textColor={stockStatus.textColor}
          bgColor={stockStatus.bgColor}
        />
      </div>

      {!isViewer && hasSubscription() && (
        <div className="w-20 px-3">
          <IconBtn
            icon={Trash}
            size="w-9 h-9"
            iconSize={16}
            onClick={() => {}}
            hoverBg={false}
            hoverText={true}
          />
        </div>
      )}
    </div>
  );
};
