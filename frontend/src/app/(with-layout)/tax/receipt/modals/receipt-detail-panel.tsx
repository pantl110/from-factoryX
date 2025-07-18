import PurchaseItemInfo from '@/app/(with-layout)/document/tax-document-view/purchase-item-info';
import InfoLabelValue from '@/ui/info-label-value';
import Panel from '@/ui/panel';
import React from 'react';

// 현금영수증 아이템 타입 정의
interface ReceiptItemModel {
  id: number;
  date: string;
  company: string;
  productName: string;
  supplyAmount: number;
  taxAmount: number;
  totalAmount: number;
}

interface ReceiptDetailPanelProps {
  onClose: () => void;
  item: ReceiptItemModel | null;
}

const ReceiptDetailPanel = ({ onClose, item }: ReceiptDetailPanelProps) => {
  if (!item) return null;

  return (
    <Panel title="현금영수증" onClose={onClose}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h3 className="Heading-3 h-10 items-center flex">거래 정보</h3>
          <div>
            <InfoLabelValue label="거래일자" value={item.date} />
            <InfoLabelValue label="승인번호" value="123456789" />
            <InfoLabelValue label="거래구분" value="승인거래" />
            <InfoLabelValue label="거래용도" value="소득공제" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="Heading-3 h-10 items-center flex">구매처 정보</h3>
          <div>
            <InfoLabelValue label="업체명" value={item.company} />
            <InfoLabelValue label="사업자등록번호" value="123-45-67890" />
            <InfoLabelValue label="대표자명" value="홍길동" />
            <InfoLabelValue
              label="사업장 주소"
              value="서울특별시 강남구 테헤란로 123"
            />
          </div>
        </div>

        <PurchaseItemInfo />

        {/* <div className="flex flex-col gap-3">
          <h3 className="Heading-3 h-10 items-center flex">구매 자재 정보</h3>
          <div>
            <InfoLabelValue label="거래일자" value={item.date} />
            <InfoLabelValue label="승인번호" value="123456789" />
            <InfoLabelValue label="거래구분" value="승인거래" />
            <InfoLabelValue label="거래용도" value="소득공제" />
          </div>
        </div> */}
      </div>
    </Panel>
  );
};

export default ReceiptDetailPanel;
