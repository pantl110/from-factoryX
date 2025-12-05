'use client';

import { RoundChip } from '@/ui';
import { ProjectResponseModel } from '@/types/data-model';
import { ProjectStatusMap, ProjectStatusType } from '@/types/status-type';
import { convertUTCToKSTDate, getProjectStatusColor } from '@/utils';

interface PendingQuoteItemProps {
  project: ProjectResponseModel;
  onClick: () => void;
}

const PendingQuoteItem = ({ project, onClick }: PendingQuoteItemProps) => {
  return (
    <div
      className="flex flex-col gap-2 p-4 border rounded-lg border-lg cursor-pointer min-w-0"
      style={{ width: '33.333%' }}
      onClick={onClick}
    >
      <div className="flex flex-col gap-2.5">
        <h4 className="Heading-4">{project.client_name || '-'}</h4>
        <div className="Me_Body-1 text-sv">
          <span>제품</span>
          <span className="text-gr"> | </span>
          <span>
            {project.quotations[0].products.length === 0
              ? '-'
              : project.quotations[0].products.length === 1
                ? project.quotations[0].products[0].product.name
                : `${project.quotations[0].products[0].product.name} 외 ${project.quotations[0].products.length - 1}개`}
          </span>
        </div>
      </div>
      <div className="flex items-center">
        <p className="flex-1 Me_Body-1 text-sv">
          {convertUTCToKSTDate(project.created_at) || '-'}
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

export default PendingQuoteItem;
