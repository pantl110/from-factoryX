import Panel from "@/ui/panel";
import { FacilityDataModel } from "@/mocks/facility-data";
import InfoLabelValue from "@/ui/info-label-value";
import { FacilityStatusType } from "../types";
import FacilityHistoryItem from "./facility-history-item";

interface FacilityDetailPanelProps {
  facility: FacilityDataModel;
  onClose: () => void;
}

const FacilityDetailPanel = ({
  facility,
  onClose,
}: FacilityDetailPanelProps) => {
  return (
    <Panel title="설비 관리" onClose={onClose}>
      <div className="flex flex-col gap-10">
        {/* 설비 정보 */}
        <div className="flex flex-col gap-3 border-b border-lg">
          <h3 className="Heading-3">설비 정보</h3>
          <div className="flex flex-col">
            <div className="flex">
              <InfoLabelValue label="설비명" value={facility.name} />
              <InfoLabelValue
                label="가동 상태"
                chip={{
                  status: facility.status as FacilityStatusType,
                }}
              />
            </div>
            <div className="flex">
              <InfoLabelValue
                label="자동 배정 순위"
                value={facility.priority.toString()}
              />
              <InfoLabelValue label="설비위치" value={facility.location} />
            </div>
          </div>
        </div>

        {/* 특이사항 */}
        <div className="flex flex-col gap-3">
          <h3 className="Heading-3">특이사항</h3>
          <textarea
            name=""
            id=""
            className="w-full h-[200px] border border-lg rounded-lg pt-5 px-3 Re_Body-1 text-gr"
          ></textarea>
        </div>

        {/* 생산 히스토리 */}
        <div className="flex flex-col gap-3">
          <h3 className="Heading-3">생산 히스토리</h3>
          <div className="flex flex-col">
            <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 text-sv rounded-sm">
              <p className="px-3 flex-1">품목명</p>
              <p className="px-3 flex-1">생산 수량</p>
              <p className="px-3 flex-1">생산일자</p>
              <p className="px-3 flex-1">단위당 시간</p>
              <p className="px-3 flex-1">마감 시간</p>
            </div>
            <FacilityHistoryItem
              productName="플라스틱컵 A"
              quantity={100}
              date="2025-06-20 11:00"
              unitTime="60초"
              deadlineTime="2025-06-20 13:00"
            />
            <FacilityHistoryItem
              productName="플라스틱컵 B"
              quantity={120}
              date="2025-06-20 11:00"
              unitTime="90초"
              deadlineTime="2025-06-20 14:00"
            />
          </div>
        </div>
      </div>
    </Panel>
  );
};

export default FacilityDetailPanel;
