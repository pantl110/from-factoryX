import MiniBtn from '@/ui/mini-btn';
import { ProjectStatusType } from '@/types/status-type';
import { CaretDown } from '@phosphor-icons/react';

interface MainTitleSecProps {
  onNewQuotation: () => void;
  selectedStatus: ProjectStatusType | 'progress';
  onStatusChange: (status: ProjectStatusType | 'progress') => void;
}

const statusTabMap = [
  { label: '전체', value: 'progress' },
  { label: '견적 협의', value: 'quotation' },
  { label: '생산 대기', value: 'pending' },
  { label: '생산 중', value: 'production' },
  { label: '생산 완료', value: 'manufactured' },
  { label: '납품', value: 'delivery' },
];

const MainTitleSec = ({
  onNewQuotation,
  selectedStatus,
  onStatusChange,
}: MainTitleSecProps) => {
  return (
    <div className="flex flex-col gap-8 pt-10 pr-10 pl-10">
      <div className="flex items-center justify-between">
        <div className="Heading-1 text-dg">진행 중인 프로젝트</div>
        <MiniBtn
          bgColor="bg-primary"
          textColor="text-white"
          text="견적서 생성"
          onClick={onNewQuotation}
          hoverColor="hover:bg-primary-hover"
          icon={CaretDown}
          iconPosition="right"
        />
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
