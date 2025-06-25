"use client";

import MiniBtn from "@/ui/mini-btn";
import { useRouter } from "next/navigation";
import PendingQuoteItem from "./pending-quote-item";
import { projectData } from "@/mocks/project-data";

const PendingQuote = () => {
  const router = useRouter();

  const pendingQuotes = projectData.filter(
    (project) => project.status === "견적 협의",
  );

  return (
    <div>
      <div className="flex justify-between items-center">
        <h3 className="Heading-3">협의 중인 견적</h3>
        <MiniBtn
          text="더보기"
          textColor="text-dg"
          borderColor="border-lg"
          onClick={() => {
            router.push("/project/process?tab=quote");
          }}
        />
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto">
        {pendingQuotes.map((project) => (
          <PendingQuoteItem
            project={project}
            key={project.id}
            onClick={() => {
              router.push(`/production/${project.id}`);
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default PendingQuote;
