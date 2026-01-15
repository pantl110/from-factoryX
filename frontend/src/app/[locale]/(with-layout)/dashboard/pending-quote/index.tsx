'use client';

import { useTranslations } from 'next-intl';
import MiniBtn from '@/ui/mini-btn';
import { useRouter } from '@/i18n/navigation';
import PendingQuoteItem from './pending-quote-item';
import { ProjectResponseModel } from '@/types/data-model';
import NoHistoryBox from '@/ui/no-history-box';
import useVisibleItemCount from '../use-visible-item-count';

interface PendingQuoteProps {
  projects: ProjectResponseModel[];
  isLoading: boolean;
}

const PendingQuote = ({ projects, isLoading }: PendingQuoteProps) => {
  const t = useTranslations('dashboard.pendingQuote');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { containerRef, visibleCount } = useVisibleItemCount();

  return (
    <>
      <div className="flex justify-between items-center">
        <h3 className="Heading-3">{t('title')}</h3>
        <MiniBtn
          text={tCommon('more')}
          textColor="text-dg"
          borderColor="border-lg"
          onClick={() => {
            router.push('/project/process?tab=quote');
          }}
          hoverColor="hover:bg-bg"
        />
      </div>

      <div
        ref={containerRef}
        className="mt-3 grid gap-2 w-full h-full overflow-hidden items-stretch [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))] [grid-auto-rows:minmax(0,1fr)]"
      >
        {isLoading || projects.length === 0 ? (
          <NoHistoryBox
            title={t('noQuote')}
            text={t('noQuoteDescription')}
            height="h-full"
          />
        ) : (
          <>
            {projects.slice(0, visibleCount).map((project) => (
              <PendingQuoteItem
                project={project}
                key={project.id}
                onClick={() => {
                  router.push(
                    `/quotation?quotation_id=${project.quotations[0].id}&project_id=${project.id}`
                  );
                }}
              />
            ))}
          </>
        )}
      </div>
    </>
  );
};

export default PendingQuote;
