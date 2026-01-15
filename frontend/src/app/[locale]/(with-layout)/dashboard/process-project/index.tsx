'use client';

import { useTranslations } from 'next-intl';
import MiniBtn from '@/ui/mini-btn';
import ProcessProjectItem from './process-project-item';
import { useRouter } from '@/i18n/navigation';
import { ProjectResponseModel } from '@/types/data-model';
import NoHistoryBox from '@/ui/no-history-box';
import useVisibleItemCount from '../use-visible-item-count';

interface ProcessProjectProps {
  projects: ProjectResponseModel[];
  isLoading: boolean;
}

const ProcessProject = ({ projects, isLoading }: ProcessProjectProps) => {
  const t = useTranslations('dashboard.processProject');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { containerRef, visibleCount } = useVisibleItemCount({
    minItemWidth: 240,
    minItemHeight: 128,
  });

  return (
    <>
      <div className="flex justify-between items-center">
        <h3 className="Heading-3">{t('title')}</h3>
        <MiniBtn
          text={tCommon('more')}
          textColor="text-dg"
          borderColor="border-lg"
          onClick={() => {
            router.push('/project/process?tab=inProduction');
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
            title={t('noProject')}
            text={t('noProjectDescription')}
            height="h-full"
          />
        ) : (
          <>
            {projects.slice(0, visibleCount).map((project) => (
              <ProcessProjectItem
                project={project}
                key={project.id}
                onClick={() => {
                  router.push(`/production/${project.id}`);
                }}
              />
            ))}
          </>
        )}
      </div>
    </>
  );
};

export default ProcessProject;
