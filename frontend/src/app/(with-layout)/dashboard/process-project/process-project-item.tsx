'use client';

import Chip from '@/ui/chip';
import { ProjectResponseModel } from '@/types/data-model';
import { ProjectStatusColorMap } from '@/types/status-type';
import { formatRelativeTime } from '@/utils/format-relative-time';

interface ProcessProjectItemProps {
  project: ProjectResponseModel;
  onClick: () => void;
}

const ProcessProjectItem = ({ project, onClick }: ProcessProjectItemProps) => {
  const getStatusColor = (status: string) => {
    const colorMap = ProjectStatusColorMap[status];
    if (colorMap) {
      return { bg: colorMap.bgColor, text: colorMap.textColor };
    }
    return { bg: 'bg-purple-8', text: 'text-purple' };
  };

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
          <span>{project.due_date}</span>
        </div>
      </div>
      <div className="flex items-center">
        <p className="flex-1 Me_Body-1 text-dg">
          {formatRelativeTime(project.start_date)}
        </p>
        <Chip
          text={project.status}
          bgColor={getStatusColor(project.status).bg}
          textColor={getStatusColor(project.status).text}
        />
      </div>
    </div>
  );
};

export default ProcessProjectItem;
