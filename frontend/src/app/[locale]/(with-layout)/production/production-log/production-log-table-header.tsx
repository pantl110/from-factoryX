'use client';

import { useTranslations } from 'next-intl';
import { ProjectStatusType } from '@/types/status-type';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';

interface ProductionLogTableHeaderProps {
  projectStatus: ProjectStatusType;
}

const ProductionLogTableHeader = ({
  projectStatus,
}: ProductionLogTableHeaderProps) => {
  const t = useTranslations('production.productionLog.tableHeader');
  const tCommon = useTranslations('common');
  const tProductionInfo = useTranslations('production.productionInfo');
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  return (
    <div className="flex items-center h-12 min-w-[1960px] Me_Body-1 text-sv rounded bg-lg-table cursor-default">
      <p className="flex-[1.6] px-3">{tCommon('productName')}</p>
      <p className="flex-1 px-3">{tCommon('productCode')}</p>
      <p className="flex-1 px-3">{tCommon('specification')}</p>
      <p className="flex-1 px-3">{tCommon('unit')}</p>
      <p className="w-[150px] px-3">{tProductionInfo('orderQuantity')}</p>
      <p className="w-[150px] px-3">{tProductionInfo('productionQuantity')}</p>
      <p className="flex-1 px-3">{tCommon('productionEquipment')}</p>
      <p className="w-[200px] px-3">{tCommon('productionDate')}</p>
      <p className="w-[140px] px-3">{tProductionInfo('timePerUnit')}</p>
      <p className="w-[150px] px-3">{t('materialStatus')}</p>
      <p className="w-[200px] px-3">{t('completionDate')}</p>
      {projectStatus === 'manufactured' && !isViewer && hasSubscription() && (
        <p className="w-[260px] px-3">{tCommon('action')}</p>
      )}
    </div>
  );
};

export default ProductionLogTableHeader;
