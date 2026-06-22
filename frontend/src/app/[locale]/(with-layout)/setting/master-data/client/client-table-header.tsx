import Checkbox from '@/ui/checkbox';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { useTranslations } from 'next-intl';

interface ClientTableHeaderProps {
  isAllChecked?: boolean;
  onToggleAll?: () => void;
}

const ClientTableHeader = ({
  isAllChecked,
  onToggleAll,
}: ClientTableHeaderProps) => {
  const tCommon = useTranslations('common');
  const tClient = useTranslations('setting.masterData.client');
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  return (
    <div className="flex h-12 min-w-[1740px] items-center border-t border-b border-lg Me_Body-3 text-sv">
      {!isViewer && hasSubscription() && (
        <Checkbox
          isChecked={isAllChecked || false}
          onToggle={onToggleAll || (() => {})}
        />
      )}
      <div className="flex-[1.3] px-3 flex gap-1 items-center">
        <p className=" text-sv">{tClient('tableHeader.clientType')}</p>
      </div>
      <p className="px-3 flex-2">{tCommon('clientName')}</p>
      <p className="px-3 flex-[1.5]">{tCommon('businessRegistrationNumber')}</p>
      <p className="px-3 flex-1">{tCommon('representativeName')}</p>
      <p className="px-3 flex-[1.5]">{tCommon('businessType')}</p>
      <p className="px-3 flex-[1.5]">{tCommon('businessCategory')}</p>
      <p className="px-3 flex-[1.5]">{tCommon('phone')}</p>
      <p className="px-3 flex-[2]">{tCommon('email')}</p>
    </div>
  );
};

export default ClientTableHeader;
