import MoBtn from '@/ui/mo-btn';
import { CaretRight } from '@phosphor-icons/react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { MobileDashboardCountsResponseModel } from '@/types/data-model';

interface SalesStatusProps {
  data: MobileDashboardCountsResponseModel;
}

const SalesStatus = ({ data }: SalesStatusProps) => {
  const t = useTranslations('mobile.dashboard.salesStatus');
  const tTopbar = useTranslations('mobile.topbar');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const totalOverdue =
    data.overdue_sales_accounts + data.overdue_purchase_accounts;

  return (
    <div className="w-full flex flex-col gap-3 px-4 pt-4 pb-3 rounded-[8px] border border-lg">
      <div className="flex flex-col gap-1.5">
        <p className="m-Body-4 text-sv">{tTopbar('accountStatus')}</p>
        <p className="m-Body">
          {t('todayTotal', { count: totalOverdue.toLocaleString() })}
        </p>
      </div>

      {/* 매출 매입 */}
      <div className="w-full flex gap-2.5">
        <div className="flex-1 bg-bg rounded-[8px] h-10 flex items-center justify-between px-3 py-2">
          <p className="m-Body-4 text-sv">{tCommon('sales')}</p>
          <p className="m-Heading-3b">
            {data.overdue_sales_accounts.toLocaleString()}
          </p>
        </div>
        <div className="flex-1 bg-bg rounded-[8px] h-10 flex items-center justify-between px-3 py-2">
          <p className="m-Body-4 text-sv">{tCommon('purchase')}</p>
          <p className="m-Heading-3b">
            {data.overdue_purchase_accounts.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex justify-center">
        <MoBtn
          text={tCommon('viewDetails')}
          variant="ghost"
          icon={<CaretRight />}
          onClick={() => router.push('/alarm?tab=payment-due')}
        />
      </div>
    </div>
  );
};

export default SalesStatus;
