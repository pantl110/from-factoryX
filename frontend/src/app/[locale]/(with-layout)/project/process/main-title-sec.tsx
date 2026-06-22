import MiniBtn from '@/ui/mini-btn';
import { ProjectStatusType } from '@/types/status-type';
import { CaretDown } from '@phosphor-icons/react';
import { OcrDataModel } from '@/types/data-model';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import SelectDropdown from './modals/select-dropdown';
import { useTranslations } from 'next-intl';

interface MainTitleSecProps {
  onNewQuotation: () => void;
  selectedStatus: ProjectStatusType | 'progress' | 'archived';
  onStatusChange: (status: ProjectStatusType | 'progress' | 'archived') => void;
  isSelectDropdownOpen?: boolean;
  onSelectDropdownClose?: () => void;
  onUploadClick?: () => void;
  onDirectInputClick?: (ocrData?: OcrDataModel) => void;
  onOrderUploadClick?: () => void;
}

const MainTitleSec = ({
  onNewQuotation,
  selectedStatus,
  onStatusChange,
  isSelectDropdownOpen,
  onSelectDropdownClose,
  onUploadClick,
  onDirectInputClick,
  onOrderUploadClick,
}: MainTitleSecProps) => {
  const t = useTranslations('project.process');
  const tStatus = useTranslations('project.status');
  const factoryId = useMemberStore((state) => state.factoryId);
  const role = useMemberStore((state) => state.role);
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  const statusTabMap = [
    { label: t('filters.all'), value: 'progress' },
    { label: tStatus('quotation'), value: 'quotation' },
    { label: tStatus('confirmed'), value: 'confirmed' },
    { label: tStatus('pending'), value: 'pending' },
    { label: tStatus('production'), value: 'production' },
    { label: tStatus('manufactured'), value: 'manufactured' },
    { label: tStatus('delivery'), value: 'delivery' },
  ];

  return (
    <div className="flex flex-col gap-8 pt-10 pr-10 pl-10">
      <div className="flex items-center justify-between">
        <div className="Heading-1 text-dg">{t('title')}</div>
        <div className="relative">
          <MiniBtn
            variant="secondary"
            text={t('createButton')}
            onClick={onNewQuotation}
            icon={CaretDown}
            iconPosition="right"
            disabled={!factoryId || role === 'viewer' || !hasSubscription()}
          />
          {isSelectDropdownOpen &&
            onSelectDropdownClose &&
            onUploadClick &&
            onDirectInputClick && (
              <div className="absolute top-full right-0 z-10 mt-2">
                <SelectDropdown
                  onClose={onSelectDropdownClose}
                  onUploadClick={onUploadClick}
                  onDirectInputClick={onDirectInputClick || (() => {})}
                  onOrderUploadClick={onOrderUploadClick || (() => {})}
                />
              </div>
            )}
        </div>
      </div>
      <div className="flex gap-4 items-center Heading-3">
        {statusTabMap.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`cursor-pointer ${
              selectedStatus === tab.value ? 'text-dg' : 'text-gr'
            } Heading-3`}
            onClick={() =>
              onStatusChange(tab.value as ProjectStatusType | 'progress')
            }
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MainTitleSec;
