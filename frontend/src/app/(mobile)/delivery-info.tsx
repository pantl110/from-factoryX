import { LabelInfo } from './label-info';

const DeliveryInfo = () => {
  return (
    <div className="px-7 py-8 flex flex-col gap-8">
      <h3 className="m-Heading-3-semibold">납품 정보</h3>
      <div className="flex flex-col gap-5">
        <LabelInfo
          label="사업장 주소"
          value="서울특별시 금천구 가산로 123, 5층"
          direction="col"
        />
        <div className="h-[1px] bg-bg" />
        <LabelInfo label="납품 수량" value="1 Box(5EA)" />
        <div className="h-[1px] bg-bg" />
        <LabelInfo label="납기일" value="2025-10-03" />
      </div>
      <div className="flex gap-3 items-center px-2 py-3 bg-bg rounded-[8px]">
        <div className="w-1.5 h-1.5 bg-lg rounded-full" />
        <h3 className="m-Body-4 text-primary">
          거래명세서와 납품표는 PC에서 확인하실 수 있습니다
        </h3>
      </div>
    </div>
  );
};

export default DeliveryInfo;
