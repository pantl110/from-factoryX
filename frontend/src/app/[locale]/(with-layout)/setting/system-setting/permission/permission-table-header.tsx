import Checkbox from '@/ui/checkbox';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { useTranslations } from 'next-intl';

interface PermissionTableHeaderProps {
  isAllChecked: boolean;
  onToggleAll: () => void;
}

const PermissionTableHeader = ({
  isAllChecked,
  onToggleAll,
}: PermissionTableHeaderProps) => {
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const isProdManager = role === 'prod_manager';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );
  const t = useTranslations('setting.systemSetting.permission.tableHeader');

  return (
    <div className="flex items-center justify-between w-full h-12 text-sv Me_Body-3 border-t border-b border-lg cursor-default">
      {!isViewer && !isProdManager && hasSubscription() && (
        <Checkbox isChecked={isAllChecked} onToggle={onToggleAll} />
      )}
      <p className="px-3 flex-1">{t('registrationStatus')}</p>
      <p className="px-3 flex-1">{t('name')}</p>
      <p className="px-3 flex-2">{t('email')}</p>
      <p className="px-3 flex-[1.2]">{t('permission')}</p>
      <p className="px-3 flex-1">{t('inviteDate')}</p>
    </div>
  );
};

export default PermissionTableHeader;
