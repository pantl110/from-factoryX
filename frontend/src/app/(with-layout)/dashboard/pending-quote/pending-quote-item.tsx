'use client';

import Chip from '@/ui/chip';
import { ProjectResponseModel } from '@/types/data-model';
import { ProjectStatusColorMap } from '@/types/status-type';

interface PendingQuoteItemProps {
  project: ProjectResponseModel;
  onClick: () => void;
}

const PendingQuoteItem = ({ project, onClick }: PendingQuoteItemProps) => {
  const getStatusColor = (status: string) => {
    const colorMap = ProjectStatusColorMap[status];
    if (colorMap) {
      return { bg: colorMap.bgColor, text: colorMap.textColor };
    }
    return { bg: 'bg-bg', text: 'text-bl' };
  };

  return (
    <div
      className="flex flex-col gap-2 p-4 border rounded-lg border-[#eeeeee] cursor-pointer min-w-0"
      style={{ width: '33.333%' }}
      onClick={onClick}
    >
      <div className="flex flex-col gap-2.5">
        <h4 className="Heading-4">{project.client_name}</h4>
        <div className="Me_Body-1 text-sv">
          <span>품목</span>
          <span className="text-gr"> | </span>
          <span>
            {project.product_names.length === 1
              ? project.product_names[0]
              : `${project.product_names[0]} 외 ${project.product_names.length - 1}개`}
          </span>
        </div>
      </div>
      <div className="flex items-center">
        <p className="flex-1 Me_Body-1 text-sv">
          {project.start_date || '날짜 미정'}
        </p>
        <Chip
          text={project.status === '견적 협의중' ? '견적 요청' : project.status}
          bgColor={getStatusColor(project.status).bg}
          textColor={getStatusColor(project.status).text}
        />
      </div>
    </div>
  );
};

export default PendingQuoteItem;
