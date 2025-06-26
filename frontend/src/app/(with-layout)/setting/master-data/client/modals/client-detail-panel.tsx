import Panel from "@/ui/panel";
import InfoLabelValue from "@/ui/info-label-value";
import { ClientDataModel } from "@/types/data-model";
import { ClientTypeColorMap } from "../types";
import Chip from "@/ui/chip";

interface ClientDetailPanelProps {
  onClose: () => void;
  client: ClientDataModel;
}

const ClientDetailPanel = ({ onClose, client }: ClientDetailPanelProps) => {
  const clientTypeColor = ClientTypeColorMap[client.type];
  return (
    <Panel title="거래처" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <h3 className="Heading-3">거래처 정보</h3>

        <div>
          <div className="flex">
            <InfoLabelValue label="거래처명" value={client.companyName} />
            <InfoLabelValue
              label="사업자등록번호"
              value={client.businessNumber}
            />
          </div>
          <div className="flex">
            <InfoLabelValue
              label="대표자명"
              value={client.representativeName}
            />
            <InfoLabelValue label="담당자 이메일" value={client.email} />
          </div>
          <div className="flex">
            <InfoLabelValue label="담당자 연락처" value={client.contact} />
            <InfoLabelValue label="팩스번호" />
          </div>
          <div className="flex">
            <InfoLabelValue label="업태" value={client.businessType} />
            <InfoLabelValue label="종목" value={client.businessCategory} />
          </div>
          <div className="flex">
            <InfoLabelValue label="사업장 주소" value={client.address} />
          </div>
          <div className="flex">
            <InfoLabelValue
              label="거래처"
              value={
                <Chip
                  text={client.type}
                  bgColor={clientTypeColor.bgColor}
                  textColor={clientTypeColor.textColor}
                  sm={true}
                />
              }
            />
          </div>
          <div className="flex border-b border-lg">
            <InfoLabelValue label="비고" value="" />
          </div>
        </div>
      </div>
    </Panel>
  );
};

export default ClientDetailPanel;
