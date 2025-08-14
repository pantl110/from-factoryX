import Chip from '@/ui/chip';
import Input from '@/ui/input';
import { ProjectStatusType, ProjectStatusColorMap } from '@/types/status-type';

export interface ProductFlowTitleProps {
  status: ProjectStatusType;
  tabs: string[];
  selectedTab: number;
  setSelectedTab: (idx: number) => void;
  companyName: string;
  dueDate: string;
  startDate: string;
  endDate: string;
}

const ProductFlowTitle = ({
  status,
  tabs,
  selectedTab,
  setSelectedTab,
  companyName,
  dueDate,
  startDate,
  endDate,
}: ProductFlowTitleProps) => {
  const { bgColor, textColor } = ProjectStatusColorMap[status];

  return (
    <>
      <div className="px-10 pt-7 flex justify-between">
        <div className="flex flex-col gap-2">
          <Chip
            text={
              status === 'completed'
                ? '프로젝트 완료'
                : status === 'delivery'
                  ? '납품'
                  : status === 'manufactured'
                    ? '생산 완료'
                    : status === 'production'
                      ? '생산 중'
                      : status === 'pending'
                        ? '생산 대기'
                        : status
            }
            textColor={textColor}
            bgColor={bgColor}
          />
          <h1 className="Heading-1 text-dg">{companyName}</h1>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center">
            <Input
              label="생산시작일"
              type="text"
              value={startDate}
              placeholder="YYYY-MM-DD"
              disabledSetting
            />
            <p className="w-[30px] h-[77px] pt-7 px-2 Re_Body-1 text-sv">__</p>
            <Input
              label="생산마감일"
              type="text"
              value={endDate}
              placeholder="YYYY-MM-DD"
              disabledSetting
            />
          </div>
          <div className="flex justify-between p-3 rounded-lg bg-[#f5f5f5] Heading-5">
            <h6>납기일</h6>
            <h6>{dueDate}</h6>
          </div>
        </div>
      </div>

      <div className="px-10 flex flex-col items-end sticky top-15 bg-white z-1">
        <div className="flex gap-4 pt-3 w-full border-b border-lg">
          {tabs.map((tab, idx) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSelectedTab(idx)}
              className={`Heading-3 pb-3 transition-colors duration-150 cursor-pointer ${
                selectedTab === idx
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gr border-b-2 border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        {/* <div className="h-[1px] bg-lg w-full"></div> */}
      </div>
    </>
  );
};

export default ProductFlowTitle;
