'use client';

import MiniBtn from '@/ui/mini-btn';
import { useRouter } from 'next/navigation';
import PendingQuoteItem from './pending-quote-item';
import { ProjectResponseModel } from '@/types/data-model';
import NoHistoryBox from '@/ui/no-history-box';

interface PendingQuoteProps {
  projects: ProjectResponseModel[];
  isLoading: boolean;
}

const PendingQuote = ({ projects, isLoading }: PendingQuoteProps) => {
  const router = useRouter();

  return (
    <div>
      <div className="flex justify-between items-center">
        <h3 className="Heading-3">견적 및 주문 현황</h3>
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

      <div className="mt-3 flex gap-2 w-full">
        {isLoading || projects.length === 0 ? (
          <NoHistoryBox
            title="협의 중인 견적이 없어요."
            text="협의 중인 견적이 등록되면 이곳에 표시돼요."
          />
        ) : (
          <>
            {projects.map((project) => (
              <PendingQuoteItem
                project={project}
                key={project.project_id}
                onClick={() => {
                  router.push(
                    `/quotation?quotation_id=${project.quotation_id}&project_id=${project.project_id}`
                  );
                }}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default PendingQuote;
