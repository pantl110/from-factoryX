import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import Checkbox from '@/ui/checkbox';
import { useTranslations } from 'next-intl';

interface TableHeaderProps {
  isAllChecked: boolean;
  onToggleAll: () => void;
}

const TableHeader = ({ isAllChecked, onToggleAll }: TableHeaderProps) => {
  const tCommon = useTranslations('common');
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  return (
    <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1">
      {!isViewer && hasSubscription() && (
        <Checkbox
          isChecked={isAllChecked}
          onToggle={onToggleAll || (() => {})}
        />
      )}
      <p className="flex-1 px-3 text-sv">{tCommon('productName')}</p>
      <p className="flex-1 px-3 text-sv">{tCommon('productCode')}</p>
      <p className="flex-1 px-3 text-sv">{tCommon('specification')}</p>
      <p className="flex-1 px-3 text-sv">{tCommon('unit')}</p>
      <p className="flex-1 px-3 text-sv">{tCommon('currentStock')}</p>
    </div>
  );
};

export default TableHeader;
