import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import Checkbox from '@/ui/checkbox';
import React from 'react';

interface FacilityTableHeaderProps {
  isAllChecked?: boolean;
  onToggleAll?: () => void;
}

const FacilityTableHeader = ({
  isAllChecked,
  onToggleAll,
}: FacilityTableHeaderProps) => {
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  return (
    <div className="flex h-12 items-center py-1 px-3 w-full border-t border-b border-[#eeeeee] Me_Body-1 text-sv px-3">
      {!isViewer && hasSubscription() && (
        <Checkbox
          isChecked={isAllChecked || false}
          onToggle={onToggleAll || (() => {})}
        />
      )}
      <p className="flex-1 px-3">가동 상태</p>
      <p className="flex-1 px-3">설비명</p>
      <p className="flex-1 px-3">자동 배정 순위</p>
      <p className="flex-2 px-3">설비위치</p>
    </div>
  );
};

export default FacilityTableHeader;
