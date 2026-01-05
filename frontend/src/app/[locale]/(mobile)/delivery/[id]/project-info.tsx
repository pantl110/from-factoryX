import { LabelInfo } from '../../label-info';
import { ProjectStatusResponseModel } from '@/types/data-model';
import InfoDetail from '../../info-detail';
import { useTranslations } from 'next-intl';

interface ProjectInfoProps {
  projectStatus: ProjectStatusResponseModel | null;
  orderQuantity: number;
}

const ProjectInfo = ({ projectStatus, orderQuantity }: ProjectInfoProps) => {
  const t = useTranslations('mobile.delivery.projectInfo');

  if (!projectStatus) {
    return null;
  }

  const clientInfo = projectStatus?.quotations?.[0]?.client_info;

  return (
    <div className="px-7 py-8 flex flex-col gap-8">
      <h3 className="m-Heading-3-semibold">{t('title')}</h3>
      <div className="flex flex-col gap-5">
        <LabelInfo label={t('projectName')} value={clientInfo?.name || '-'} />
        <LabelInfo label={t('quantity')} />
        <div className="flex flex-col gap-2">
          <InfoDetail
            label={t('orderQuantity')}
            value={orderQuantity > 0 ? orderQuantity.toLocaleString() : '-'}
          />
          <InfoDetail label={t('scannedQuantity')} value="구현필요300" />
        </div>
        <LabelInfo
          label={t('dueDate')}
          value={projectStatus?.due_date || '-'}
        />
      </div>
    </div>
  );
};

export default ProjectInfo;
