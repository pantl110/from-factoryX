'use client';

import { useTranslations } from 'next-intl';
import MiniBtn from '@/ui/mini-btn';
import ProcessProjectItem from './process-project-item';
import { useRouter } from '@/i18n/navigation';
import { ProjectResponseModel } from '@/types/data-model';
import NoHistoryBox from '@/ui/no-history-box';

interface ProcessProjectProps {
  projects: ProjectResponseModel[];
  isLoading: boolean;
}

const ProcessProject = ({ projects, isLoading }: ProcessProjectProps) => {
  const t = useTranslations('dashboard.processProject');
  const tCommon = useTranslations('common');
  const router = useRouter();

  return (
    <div>
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
      <div className="mt-3 flex gap-2">
        {isLoading || projects.length === 0 ? (
          <NoHistoryBox
            title={t('noProject')}
            text={t('noProjectDescription')}
          />
        ) : (
          <>
            {projects.map((project) => (
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
    </div>
  );
};

export default ProcessProject;
