"use client";

import { ProjectDataModel } from "@/mocks/project-data";
import Chip from "@/ui/chip";

interface PendingQuoteItemProps {
  project: ProjectDataModel;
  onClick: () => void;
}

const PendingQuoteItem = ({ project, onClick }: PendingQuoteItemProps) => {
  return (
    <div
      className="flex flex-col flex-shrink-0 w-[453px] gap-2 p-4 border rounded-lg border-[#eeeeee] cursor-pointer"
      onClick={onClick}
    >
      <div className="flex flex-col gap-2.5">
        <h4 className="Heading-4">{project.companyName}</h4>
        <div className="Me_Body-1 text-sv">
          <span>품목</span>
          <span className="text-gr"> | </span>
          <span>{project.items}</span>
        </div>
      </div>
      <div className="flex items-center">
        <p className="flex-1 Me_Body-1 text-sv">{project.endDate}</p>
        <Chip text="견적 협의" bgColor="bg-bg" textColor="text-bl" />
      </div>
    </div>
  );
};

export default PendingQuoteItem;
