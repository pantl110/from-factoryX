import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import Checkbox from '@/ui/checkbox';
// import { CaretUpDown } from '@phosphor-icons/react/dist/ssr';
import { useTranslations } from 'next-intl';

interface TableHeaderProps {
  isAllChecked: boolean;
  onToggleAll: () => void;
  currentOrder?: 'asc' | 'desc';
  onSortChange?: (order: 'asc' | 'desc') => void;
}

const TableHeader = ({
  isAllChecked,
  onToggleAll,
  // currentOrder,
  // onSortChange,
}: TableHeaderProps) => {
  const t = useTranslations('stock.material');
  const tCommon = useTranslations('common');
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  // const handleSortClick = () => {
  //   if (onSortChange) {
  //     const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
  //     onSortChange(newOrder);
  //   }
  // };

  return (
    <div className="flex items-center h-12 border-t border-b border-lg Me_Body-3">
      {!isViewer && hasSubscription() && (
        <Checkbox
          isChecked={isAllChecked}
          onToggle={onToggleAll || (() => {})}
        />
      )}
      <p className="flex-1 px-3 text-sv">{t('tableHeader.name')}</p>
      <p className="flex-1 px-3 text-sv">{t('tableHeader.code')}</p>
      <p className="flex-1 px-3 text-sv">{tCommon('specification')}</p>
      <p className="flex-[0.5] px-3 text-sv">{tCommon('unit')}</p>
      <p className="flex-[0.8] px-3 text-sv">{tCommon('taxClassification')}</p>
      <div
        className="px-3 flex-1 h-full flex items-center gap-1"
        // cursor-pointer hover:bg-bg
        // onClick={handleSortClick}
      >
        <p className="text-sv">{tCommon('currentStock')}</p>
        {/* <CaretUpDown size={21} className="text-sv" /> */}
      </div>
      <p className="w-[150px] text-sv px-3">
        {t('tableHeader.materialStatus')}
      </p>
      <p className="w-[150px] text-sv px-3">
        {t('tableHeader.expirationDateStatus')}
      </p>
    </div>
  );
};

export default TableHeader;
