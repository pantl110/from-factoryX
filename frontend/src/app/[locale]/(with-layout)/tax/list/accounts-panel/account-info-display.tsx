import { InfoLabelValue } from '@/ui';

interface AccountInfoDisplayProps {
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
}

// 지급 계좌 정보 표시 컴포넌트 (매입용)
export const AccountInfoDisplay = ({
  bankName,
  accountNumber,
  accountHolder,
}: AccountInfoDisplayProps) => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3">지급 계좌 정보</h3>

      <div>
        <div className="flex">
          <InfoLabelValue label="은행명" value={bankName || '-'} />
          <InfoLabelValue label="계좌번호" value={accountNumber || '-'} />
        </div>
        <div className="flex border-b border-lg w-full">
          <InfoLabelValue label="예금주" value={accountHolder || '-'} />
        </div>
      </div>
    </div>
  );
};
