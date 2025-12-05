'use client';

import { RoundChip } from '@/ui';
import { ProjectResponseModel } from '@/types/data-model';
import { ProjectStatusMap, ProjectStatusType } from '@/types/status-type';
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
  return (
    <div
      className="flex flex-col gap-4 p-4 border rounded-lg border-[#eeeeee] cursor-pointer min-w-0"
      style={{ width: '25%' }}
      onClick={onClick}
    >
      <div className="flex flex-col gap-1">
        <h4 className="Heading-4">{project.client_name}</h4>
        <div className="Me_Body-1 text-sv">
          <span>납기일자</span>
          <span className="text-gr"> | </span>
          <span>{project.quotations[0].due_date}</span>
        </div>
      </div>
      <div className="flex items-center">
        <p className="flex-1 Me_Body-1 text-dg">
          {formatRelativeTime(getStartDate(project))}
        </p>
        <RoundChip
          text={ProjectStatusMap[project.status as ProjectStatusType]}
          color={getProjectStatusColor(project.status)}
          variant="defaultSmall"
        />
      </div>
    </div>
  );
};

export default ProcessProjectItem;
