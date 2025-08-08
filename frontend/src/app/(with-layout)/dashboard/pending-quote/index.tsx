'use client';

import MiniBtn from '@/ui/mini-btn';
import { useRouter } from 'next/navigation';
import PendingQuoteItem from './pending-quote-item';
import { ProjectResponseModel } from '@/types/data-model';

interface PendingQuoteProps {
  projects: ProjectResponseModel[];
}

const PendingQuote = ({ projects }: PendingQuoteProps) => {
  const router = useRouter();

  return (
    <div>
      <div className="flex justify-between items-center">
        <h3 className="Heading-3">협의 중인 견적</h3>
        <MiniBtn
          text="더보기"
          textColor="text-dg"
          borderColor="border-lg"
          onClick={() => {
            router.push('/project/process?tab=quote');
          }}
          hoverColor="hover:bg-bg"
        />
      </div>
      <div className="mt-3 flex gap-2">
        {projects.map((project) => (
          <PendingQuoteItem
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

export default PendingQuote;
