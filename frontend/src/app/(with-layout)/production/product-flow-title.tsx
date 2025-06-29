import Chip from "@/ui/chip";
import Input from "@/ui/input";
import { ProjectStatusType, ProjectStatusColorMap } from "@/types/status-type";

export interface ProductFlowTitleProps {
  status: ProjectStatusType;
  tabs: string[];
  selectedTab: number;
  setSelectedTab: (idx: number) => void;
}

const ProductFlowTitle = ({
  status,
  tabs,
  selectedTab,
  setSelectedTab,
}: ProductFlowTitleProps) => {
  const { bgColor, textColor } = ProjectStatusColorMap[status];

  return (
    <div className="px-10 pt-7">
      <div className="flex justify-between">
        <div className="flex flex-col gap-2">
          <Chip text={status} textColor={textColor} bgColor={bgColor} />
          <h1 className="Heading-1 text-dg">플라스틱이 좋아</h1>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center">
            <Input label="생산시작일" type="date" />
            <p className="w-[30px] h-[77px] pt-7 px-2 Re_Body-1 text-sv">__</p>
            <Input label="생산마감일" type="date" />
          </div>
          <div className="flex justify-between p-3 rounded-lg bg-[#f5f5f5] Heading-5">
            <h6>납기일</h6>
            <h6>2025-07-31</h6>
          </div>
        </div>
      </div>
      <div className="h-[62px] border-b border-lg flex items-end">
        <div className="flex gap-4 pt-3 w-full">
          {tabs.map((tab, idx) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSelectedTab(idx)}
              className={`Heading-3 px-2 pb-2 transition-colors duration-150 cursor-pointer ${
                selectedTab === idx
                  ? "text-primary border-b-2 border-primary"
                  : "text-gr border-b-2 border-transparent"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductFlowTitle;
