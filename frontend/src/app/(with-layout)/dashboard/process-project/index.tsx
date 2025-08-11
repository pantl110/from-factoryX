'use client';

import MiniBtn from '@/ui/mini-btn';
import ProcessProjectItem from './process-project-item';
import { useRouter } from 'next/navigation';
import { ProjectResponseModel } from '@/types/data-model';
import Spinner from '@/ui/spinner';

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
      {isLoading ? (
        <div className="mt-3 flex items-center justify-center h-[120px]">
          <Spinner />
        </div>
      ) : projects.length === 0 ? (
        <div className="mt-3 flex items-center justify-center h-[120px]">
          <div className="text-gr">생산 프로젝트가 없습니다.</div>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          {projects.map((project) => (
            <ProcessProjectItem
              project={project}
              key={project.project_id}
              onClick={() => {
                router.push(`/production/${project.project_id}`);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProcessProject;
