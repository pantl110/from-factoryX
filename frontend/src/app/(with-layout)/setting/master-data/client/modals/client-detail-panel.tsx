import Panel from "@/ui/panel";
import InfoLabelValue from "@/ui/info-label-value";
import { ClientDataModel } from "@/types/data-model";
import { ClientTypeColorMap } from "../types";
import Chip from "@/ui/chip";
import {
  formatBusinessNumber,
  formatPhoneNumber,
  formatFaxNumber,
} from "@/hooks/format-number";

interface ClientDetailPanelProps {
  onClose: () => void;
  client: ClientDataModel;
}

const ClientDetailPanel = ({ onClose, client }: ClientDetailPanelProps) => {
  const clientTypeColor = ClientTypeColorMap[client.type];
  return (
    <Panel title="거래처" onClose={onClose} hasSaveButton={true}>
      <div className="flex flex-col gap-3">
        <h3 className="Heading-3">거래처 정보</h3>

        <div>
          <div className="flex">
            <InfoLabelValue
              label="거래처명"
              value={client.companyName}
              isEditing={true}
            />
            <InfoLabelValue
              label="사업자등록번호"
              value={formatBusinessNumber(client.businessNumber)}
              isEditing={true}
            />
          </div>
          <div className="flex">
            <InfoLabelValue
              label="대표자명"
              value={client.representativeName}
              isEditing={true}
            />
            <InfoLabelValue
              label="이메일"
              value={client.email}
              isEditing={true}
            />
          </div>
          <div className="flex">
            <InfoLabelValue
              label="연락처"
              value={formatPhoneNumber(client.contact || "")}
              isEditing={true}
              placeholder="-"
            />
            <InfoLabelValue
              label="팩스 번호"
              value={formatFaxNumber(client.fax || "")}
              isEditing={true}
              placeholder="-"
            />
          </div>
          <div className="flex">
            <InfoLabelValue
              label="업태"
              value={client.businessType}
              isEditing={true}
            />
            <InfoLabelValue
              label="종목"
              value={client.businessCategory}
              isEditing={true}
            />
          </div>
          <div className="flex">
            <InfoLabelValue
              label="사업장 주소"
              value={client.companyAddress}
              isEditing={true}
            />
          </div>
          <div className="flex">
            <InfoLabelValue
              label="거래처"
              value={
                <Chip
                  text={client.type}
                  bgColor={clientTypeColor.bgColor}
                  textColor={clientTypeColor.textColor}
                />
              }
            />
          </div>
          <div className="flex border-b border-lg w-full">
            <InfoLabelValue
              label="비고"
              value=""
              isEditing={true}
              placeholder="-"
              textarea={true}
            />
          </div>
        </div>
      </div>
    </Panel>
  );
};

export default ClientDetailPanel;
