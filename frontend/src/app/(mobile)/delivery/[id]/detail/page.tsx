'use client';

import { LabelInfo } from '@/app/(mobile)/label-info';
import Topbar from '@/app/(mobile)/topbar';
import { MoBottomNavigation } from '@/ui';

const DeliveryDetailPage = () => {
  return (
    <div className="pb-6">
      <Topbar title="스캔 결과" />
      <div className="px-7 py-8 flex flex-col gap-8">
        <h3 className="m-Heading-3-semibold">스캔된 LOT 정보</h3>
        <div className="flex flex-col gap-5">
          <LabelInfo label="제품명" value="플라스틱 1" />
          <LabelInfo label="제품코드" value="12345678" />
          <LabelInfo label="규격" value="200ml" />
          <LabelInfo label="생산 일자" value="2025-12-04" />
          <LabelInfo label="LOT 번호" value="LOT-2025-00123" />
          <LabelInfo label="포장 수량" value="1 Box (100EA)" />
        </div>
      </div>
      <MoBottomNavigation type="scan" onClick={() => {}} />
    </div>
  );
};

export default DeliveryDetailPage;
