import InfoDetail from '../info-detail';
import { LabelInfo } from '../label-info';
import MoBtn from '@/ui/mo-btn';
import { CaretRight } from '@phosphor-icons/react';

interface AccountInfoProps {
  type: string;
}

const AccountInfo = ({ type }: AccountInfoProps) => {
  return (
    <div className="px-7 py-8 flex flex-col gap-8">
      <h3 className="m-Heading-3-semibold">약정 정보</h3>
      <div className="flex flex-col gap-5">
        <LabelInfo label="진행상태" value="" />
        <LabelInfo
          label={type === 'income' ? '약정입금일' : '약정지급일'}
          value="2025-10-03"
        />
        <LabelInfo label="총 합계 금액" value="50,000원" />
        <div className="flex flex-col gap-4">
          <LabelInfo label={type === 'income' ? '최근입금일' : '최근지급일'} />
          <div className="flex flex-col gap-3">
            <InfoDetail label="2025-09-15" value="20,000원" />
            <InfoDetail label="2025-09-25" value="10,000원" />
            <InfoDetail label="2025-10-02" value="10,000원" />
          </div>
        </div>
        <div className="h-[1px] bg-bg" />
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <h4 className="m-Heading-4b">
              잔액{type === 'income' ? '(미수금)' : '(미지급금)'}
            </h4>
            <span className="m-Heading-3-semibold text-primary">0원</span>
          </div>
          <p className="flex justify-end m-Body-2 text-sv">
            {type === 'income' ? '납품일' : '발행일'} + 45일 지급
          </p>
        </div>
        <div className="h-[1px] bg-bg" />
      </div>

      {/* info */}
      <div className="flex flex-col gap-2 px-2 py-3 bg-bg rounded-[8px]">
        <div className="flex gap-2 items-center">
          <div className="w-1.5 h-1.5 bg-lg rounded-full" />
          <h3 className="m-Body-4 text-primary">
            {type === 'income' ? '입금일' : '지급일'} 관련 정보는 PC 버전에서만
            입력 가능합니다.
          </h3>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-1.5 h-1.5 bg-lg rounded-full" />
          <h3 className="m-Body-4 text-primary">
            {type === 'income' ? '매출' : '매입'} 세금계산서는 PC 버전에서
            확인하실 수 있습니다.
          </h3>
        </div>
      </div>

      {/* 버튼 */}
      {type === 'income' && (
        <MoBtn
          text="납기 상세 보러가기"
          variant="outline"
          icon={<CaretRight />}
          width="w-full"
          onClick={() => {}}
        />
      )}
    </div>
  );
};

export default AccountInfo;
