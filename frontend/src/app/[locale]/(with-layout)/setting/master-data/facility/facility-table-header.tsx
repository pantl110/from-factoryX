import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import Checkbox from '@/ui/checkbox';
import React from 'react';
import { useTranslations } from 'next-intl';

interface FacilityTableHeaderProps {
  isAllChecked?: boolean;
  onToggleAll?: () => void;
}

const FacilityTableHeader = ({
  isAllChecked,
  onToggleAll,
}: FacilityTableHeaderProps) => {
  const tFacility = useTranslations('setting.masterData.facility.detailPanel');
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  return (
    <div className="flex h-12 items-center py-1 px-3 w-full border-t border-b border-lg Me_Body-1 text-sv">
      {!isViewer && hasSubscription() && (
        <Checkbox
          isChecked={isAllChecked || false}
          onToggle={onToggleAll || (() => {})}
        />
      )}
      <p className="flex-1 px-3">{tFacility('operationStatus')}</p>
      <p className="flex-1 px-3">{tFacility('facilityName')}</p>
      <p className="flex-1 px-3">{tFacility('priority')}</p>
      <p className="flex-2 px-3">{tFacility('location')}</p>
    </div>
  );
};

export default FacilityTableHeader;
