'use client';

import MiniBtn from '@/ui/mini-btn';
import ProcessProjectItem from './process-project-item';
import { useRouter } from 'next/navigation';
import { ProjectResponseModel } from '@/types/data-model';
import NoHistoryBox from '@/ui/no-history-box';

interface ProcessProjectProps {
  projects: ProjectResponseModel[];
  isLoading: boolean;
}

const ProcessProject = ({ projects, isLoading }: ProcessProjectProps) => {
  const router = useRouter();

  return (
    <div>
      <div className="flex justify-between items-center">
        <h3 className="Heading-3">생산 프로젝트</h3>
        <MiniBtn
          text="더보기"
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
            title="진행 중인 프로젝트가 없어요."
            text="프로젝트를 생성하면 이곳에서 확인할 수 있어요."
          />
        ) : (
          <>
            {projects.map((project) => (
              <ProcessProjectItem
                project={project}
                key={project.project_id}
                onClick={() => {
                  router.push(`/production/${project.project_id}`);
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
