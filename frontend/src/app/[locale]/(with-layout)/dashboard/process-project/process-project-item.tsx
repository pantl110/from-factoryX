'use client';

import { useTranslations } from 'next-intl';
import { RoundChip } from '@/ui';
import { ProjectResponseModel } from '@/types/data-model';
import { ProjectStatusType } from '@/types/status-type';
import {
  formatRelativeTime,
  getStartDate,
  getProjectStatusColor,
} from '@/utils';

interface ProcessProjectItemProps {
  project: ProjectResponseModel;
  onClick: () => void;
}

const ProcessProjectItem = ({ project, onClick }: ProcessProjectItemProps) => {
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('project.status');
  const tRoot = useTranslations();

  return (
    <div
      className="flex flex-col gap-4 p-4 border border-lg rounded-lg cursor-pointer min-w-[240px] min-h-[128px] self-stretch h-full justify-between"
      onClick={onClick}
    >
      <div className="flex flex-col gap-1">
        <h4 className="Heading-4">{project.client_name}</h4>
        <div className="Me_Body-3 text-sv">
          <span>{tCommon('dueDate')}</span>
          <span className="text-gr"> | </span>
          <span>{project.quotations[0].due_date}</span>
        </div>
      </div>
      <div className="flex items-center">
        <p className="flex-1 Me_Body-3 text-dg">
          {formatRelativeTime(getStartDate(project), tRoot)}
        </p>
        <RoundChip
          text={tStatus(project.status as ProjectStatusType)}
          color={getProjectStatusColor(project.status)}
          variant="defaultSmall"
        />
      </div>
    </div>
  );
};

export default ProcessProjectItem;
