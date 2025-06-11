"use client";

import MainTitleSection from "@/components/main-title-section";
import SearchInput from "@/ui/search-input";
import ProjectTable from "@/components/project-table";
import MiniBtn from "@/ui/mini-btn";

import { TrashIcon } from "@phosphor-icons/react/dist/ssr";

const ProjectPage = () => {
  return (
    <div className="flex flex-col gap-8">
      <MainTitleSection />
      <div className="px-8">
        <div className="flex items-center justify-between pb-4">
          <SearchInput />
          <MiniBtn
            text="삭제"
            textColor="text-dg"
            borderColor="border-[#eeeeee]"
            icon={TrashIcon}
            iconColor="text-sv"
          />
        </div>
        <ProjectTable />
      </div>
    </div>
  );
};

export default ProjectPage;
