import MiniBtn from '@/ui/mini-btn';
import { ProjectStatusType } from '@/types/status-type';
import { CaretDown } from '@phosphor-icons/react';
import SelectDropdown from './modals/select-modal';
import { OcrDataModel } from '@/types/data-model';

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

const statusTabMap = [
  { label: '전체', value: 'progress' },
  { label: '견적 요청', value: 'quotation' },
  { label: '주문 확정', value: 'confirmed' },
  { label: '생산 대기', value: 'pending' },
  { label: '생산 중', value: 'production' },
  { label: '생산 완료', value: 'manufactured' },
  { label: '납품', value: 'delivery' },
];

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
  return (
    <div className="flex flex-col gap-8 pt-10 pr-10 pl-10">
      <div className="flex items-center justify-between">
        <div className="Heading-1 text-dg">진행 중인 프로젝트</div>
        <div className="relative">
          <MiniBtn
            bgColor="bg-primary"
            textColor="text-white"
            text="프로젝트 생성"
            onClick={onNewQuotation}
            hoverColor="hover:bg-primary-hover"
            icon={CaretDown}
            iconPosition="right"
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
