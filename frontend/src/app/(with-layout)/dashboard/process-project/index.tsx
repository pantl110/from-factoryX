"use client";

import MiniBtn from "@/ui/mini-btn";
import ProcessProjectItem from "./process-project-item";
import { useRouter } from "next/navigation";
import { projectData } from "@/mocks/project-data";

const ProcessProject = () => {
  const router = useRouter();

  const processProjects = projectData.filter(
    (project) => project.status === "생산 중",
  );

  return (
    <div>
      <div className="flex justify-between items-center">
        <h3 className="Heading-3">생산 프로젝트</h3>
        <MiniBtn
          text="더보기"
          textColor="text-dg"
          borderColor="border-lg"
          onClick={() => {
            router.push("/project/process?tab=inProduction");
          }}
          hoverColor="hover:bg-bg"
        />
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto">
        {processProjects.map((project) => (
          <ProcessProjectItem
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

export default ProcessProject;
