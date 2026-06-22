'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

interface ShortageCountProps {
  shortageMaterialsCount: number;
}

const ShortageCount = ({ shortageMaterialsCount }: ShortageCountProps) => {
  const t = useTranslations('dashboard.summaryKPI');
  const router = useRouter();

  return (
    shortageMaterialsCount !== undefined && (
      <div className="flex flex-col pt-5 pb-4 px-5 rounded-lg border border-lg flex-1 shadow-[2px_2px_22px_rgba(0,0,0,0.1)] group">
        <div className="flex flex-col gap-1">
          <p className="Heading-4 text-sv">{t('shortageMaterials')}</p>
          <div className="flex flex-col gap-1">
            <p className="Heading-1">
              {shortageMaterialsCount}{' '}
              <span>
                {shortageMaterialsCount === 1 ? t('item') : t('items')}
              </span>
            </p>
          </div>
        </div>
        <div className="flex justify-end mt-auto">
          <button
            onClick={() => {
              router.push('/stock?tab=material');
            }}
            className="px-4 rounded-md Me_Body-3 text-dg border border-lg opacity-0 hover:bg-bg group-hover:opacity-100 transition-opacity duration-200"
          >
            {t('checkShortageMaterials')}
          </button>
        </div>
      </div>
    )
  );
};

export default ShortageCount;
