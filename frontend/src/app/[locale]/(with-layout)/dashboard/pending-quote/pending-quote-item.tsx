'use client';

import { useTranslations } from 'next-intl';
import { RoundChip } from '@/ui';
import { ProjectResponseModel } from '@/types/data-model';
import { ProjectStatusType } from '@/types/status-type';
import { formatISODate, getProjectStatusColor } from '@/utils';

interface PendingQuoteItemProps {
  project: ProjectResponseModel;
  onClick: () => void;
}

const PendingQuoteItem = ({ project, onClick }: PendingQuoteItemProps) => {
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('project.status');

  const productCount = project.quotations[0].products.length;
  const getProductDisplayText = () => {
    if (productCount === 0) return '-';
    if (productCount === 1) {
      return project.quotations[0].products[0].product.name;
    }
    return tCommon('listFormat', {
      first: project.quotations[0].products[0].product.name,
      count: productCount - 1,
    });
  };

  return (
    <div
      className="flex flex-col gap-2 justify-between p-4 border rounded-lg border-lg cursor-pointer min-w-[240px] min-h-[128px] self-stretch h-full"
      onClick={onClick}
    >
      <div className="flex flex-col gap-2.5">
        <h4 className="Heading-4">{project.client_name || '-'}</h4>
        <div
          className="Me_Body-1 text-sv truncate"
          title={getProductDisplayText()}
        >
          {/* <span>{tCommon('productName')}</span> */}
          {/* <span className="text-gr"> | </span> */}
          <span>{getProductDisplayText()}</span>
        </div>
      </div>
      <div className="flex items-center">
        <p className="flex-1 Me_Body-1 text-sv">
          {formatISODate(project.created_at) || '-'}
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

export default PendingQuoteItem;
