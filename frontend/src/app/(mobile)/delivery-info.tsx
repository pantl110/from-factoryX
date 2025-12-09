import { MoBtn, MoInput } from '@/ui';
import { LabelInfo } from './label-info';
import { useState } from 'react';

interface DeliveryInfoProps {
  isOrderPage?: boolean;
  address?: string | null;
  dueDate?: string | null;
}

const DeliveryInfo = ({
  isOrderPage = false,
  address,
  dueDate,
}: DeliveryInfoProps) => {
  const [deliveryType, setDeliveryType] = useState<string>('');
  const handleDeliveryType = (type: string) => {
    setDeliveryType(type);
  };

  return (
    <div className="px-7 py-8 flex flex-col gap-8">
      <h3 className="m-Heading-3-semibold">납품 정보</h3>
      <div className="flex flex-col gap-5">
        <LabelInfo label="사업장 주소" value={address || '-'} direction="col" />
        {isOrderPage || (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <LabelInfo label="배송 방식" />
              <div className="flex gap-2.5">
                <MoBtn
                  text="택배"
                  variant={
                    deliveryType === '택배' ? 'outline-primary' : 'outline'
                  }
                  width="flex-1"
                  onClick={() => handleDeliveryType('택배')}
                />
                <MoBtn
                  text="화물"
                  variant={
                    deliveryType === '화물' ? 'outline-primary' : 'outline'
                  }
                  width="flex-1"
                  onClick={() => handleDeliveryType('화물')}
                />
                <MoBtn
                  text="직접"
                  variant={
                    deliveryType === '직접' ? 'outline-primary' : 'outline'
                  }
                  width="flex-1"
                  onClick={() => handleDeliveryType('직접')}
                />
              </div>
            </div>
            {deliveryType === '택배' && (
              <MoInput
                label="송장 번호"
                placeholder="송장 번호를 입력하세요."
              />
            )}
            {deliveryType === '화물' && (
              <MoInput
                label="차량 번호"
                placeholder="차량 번호를 입력하세요."
              />
            )}
          </div>
        )}
        <div className="h-[1px] bg-bg" />

        <LabelInfo label="납기일" value={dueDate || '-'} />
      </div>

      {/* {isOrderPage || (
        <div className="flex gap-3 items-center px-2 py-3 bg-bg rounded-[8px]">
          <div className="w-1.5 h-1.5 bg-lg rounded-full" />
          <h3 className="m-Body-4 text-primary">
            거래명세서와 납품표는 PC에서 확인하실 수 있습니다
          </h3>
        </div>
      )} */}
    </div>
  );
};

export default DeliveryInfo;
