import { useTranslations } from 'next-intl';
import { CompletedProjectStatusType } from '@/types/status-type';

interface MainTitleSecProps {
  selectedStatus: '전체' | CompletedProjectStatusType;
  onStatusChange: (status: '전체' | CompletedProjectStatusType) => void;
}

const MainTitleSec = ({
  selectedStatus,
  onStatusChange,
}: MainTitleSecProps) => {
  const t = useTranslations('project.completed');
  const tFilters = useTranslations('project.completed.filters');

  return (
    <>
      <div className="flex flex-col gap-8 px-10 pt-10">
        <div className="Heading-1 text-dg">{t('title')}</div>
        <div className="flex gap-4 items-center Heading-3">
          <button
            className={`cursor-pointer Heading-3 ${selectedStatus === '전체' ? 'text-dg' : 'text-gr'} `}
            onClick={() => onStatusChange('전체')}
          >
            {tFilters('all')}
          </button>
          <button
            className={`cursor-pointer Heading-3 ${selectedStatus === '완료' ? 'text-dg' : 'text-gr'} `}
            onClick={() => onStatusChange('완료')}
          >
            {tFilters('completed')}
          </button>
          <button
            className={`cursor-pointer Heading-3 ${selectedStatus === '중단' ? 'text-dg' : 'text-gr'} `}
            onClick={() => onStatusChange('중단')}
          >
            {tFilters('suspended')}
          </button>
        </div>
      </div>
    </>
  );
};

export default MainTitleSec;
