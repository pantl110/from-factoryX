import InfoLabelValue from '@/ui/info-label-value';
import MiniBtn from '@/ui/mini-btn';
import { useState } from 'react';
import RegisterProductionModal from '../modals/register-production-modal';
import { RefundModel } from '@/types/data-model';

interface ReturnInfoProps {
  refundData: RefundModel;
  isProduction?: boolean;
}

const ReturnInfo = ({ refundData, isProduction }: ReturnInfoProps) => {
  const [isRegisterProductionModalOpen, setIsRegisterProductionModalOpen] =
    useState(false);

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex justify-between">
          <h3 className="Heading-3 text-dg flex items-center">반품 정보</h3>
          <div className="flex gap-2.5">
            <div className={`${isProduction ? 'hidden' : ''}`}>
              <MiniBtn
                text="수정하기"
                textColor="text-dg"
                borderColor="border-lg"
                hoverColor="hover:bg-bg"
              />
            </div>

            <MiniBtn
              text="생산 등록하기"
              hoverColor="hover:bg-primary-hover"
              textColor="text-wh"
              bgColor="bg-primary"
              disabled={!isProduction}
              onClick={() => setIsRegisterProductionModalOpen(true)}
            />
          </div>
        </div>

        <div>
          <div className="border-t border-b border-lg">
            <InfoLabelValue label="반품품목" value={refundData.product.name} />
          </div>
          <div className="border-b border-lg">
            <InfoLabelValue label="반품일자" value={refundData.refund_date} />
          </div>
          <div className="border-b border-lg">
            <InfoLabelValue label="반품수량" value={refundData.amount} />
          </div>
          <div className="border-b border-lg">
            <InfoLabelValue label="현재재고" value={refundData.current_stock} />
          </div>
          <div className="border-b border-lg">
            <InfoLabelValue
              label="생산수량"
              value={refundData.production_amount}
            />
          </div>
        </div>
      </div>

      {isRegisterProductionModalOpen && (
        <RegisterProductionModal
          onClose={() => setIsRegisterProductionModalOpen(false)}
        />
      )}
    </>
  );
};

export default ReturnInfo;
