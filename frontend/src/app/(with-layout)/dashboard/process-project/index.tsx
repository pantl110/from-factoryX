'use client';

import MiniBtn from '@/ui/mini-btn';
import ProcessProjectItem from './process-project-item';
import { useRouter } from 'next/navigation';
import { ProjectResponseModel } from '@/types/data-model';

interface ProcessProjectProps {
  projects: ProjectResponseModel[];
}

const ProcessProject = ({ projects }: ProcessProjectProps) => {
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
    </div>
  );
};

export default ProcessProject;
