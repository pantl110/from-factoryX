import IconBtn from '@/ui/icon-btn';
import { ArrowLineUpRight, X } from '@phosphor-icons/react';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import Chip from '@/ui/chip';

export const SubMaterialItem = () => {
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );
  return (
    <div className="flex items-center h-14 border-b border-lg transition-colors duration-200 ease-in-out Me_Body-1 group cursor-default">
      <div
        className="flex-1 px-3 flex items-center justify-between gap-1 min-w-0"
        // title={productName}
      >
        <p className="text-dg truncate">투명 아크릴판 1</p>
        <IconBtn
          icon={ArrowLineUpRight}
          size="w-9 h-9"
          iconSize={16}
          onClick={() => {}} // TODO: 자재 클릭 핸들러 추가
          groupHover={true}
        />
      </div>

      <p className="flex-1 px-3 text-dg">1111</p>
      <p className="flex-[1.5] px-3 text-dg">LOT-20251019-01</p>
      <p className="flex-1 px-3 text-dg">2000EA</p>

      <div className="flex-1 px-3">
        <Chip text="충분" textColor="text-primary" bgColor="bg-primary-8" />
      </div>

      {!isViewer && hasSubscription() && (
        <IconBtn
          icon={X}
          size="w-9 h-9"
          iconSize={16}
          onClick={() => {}}
          groupHover={true}
        />
      )}
    </div>
  );
};
