import Chip from "@/ui/chip";
import { ProjectDataModel } from "@/mocks/project-data";

interface ProcessProjectItemProps {
  project: ProjectDataModel;
}

const ProcessProjectItem = ({ project }: ProcessProjectItemProps) => {
  return (
    <div className="flex flex-col gap-4 w-[293px] flex-shrink-0 p-4 border rounded-lg border-[#eeeeee]">
      <div className="flex flex-col gap-1">
        <h4 className="Heading-4">{project.companyName}</h4>
        <div className="Me_Body-1 text-sv">
          <span>{project.endDate}</span>
          <span className="text-gr"> | </span>
          <span>{project.items}</span>
        </div>
      </div>
      <div className="flex items-center">
        <p className="flex-1 Me_Body-1 text-dg">3일 전</p>
        <Chip text="생산 중" bgColor="bg-purple-8" textColor="text-purple" />
      </div>
    </div>
  );
};

export default ProcessProjectItem;
