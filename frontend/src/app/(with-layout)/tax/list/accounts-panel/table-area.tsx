import { MiniBtn } from '@/ui';
import Table from './table';
import { TaxInvoiceAccountModel } from '@/types/data-model';

interface TableAreaProps {
  isPurchase: boolean;
  taxId: number;
  account: TaxInvoiceAccountModel | null;
  onOpenCreateAccountPaymentModal: () => void;
  onOpenSendEmailModal: () => void;
  type?: 'tax' | 'cash-receipt';
}

const TableArea = ({
  isPurchase,
  taxId,
  account,
  onOpenCreateAccountPaymentModal,
  onOpenSendEmailModal,
  type = 'tax',
}: TableAreaProps) => {
  const title = isPurchase ? '지급 상세 내역' : '회수 상세 내역';
  const inputButtonText = isPurchase
    ? '지급 정보 입력하기'
    : '입금 정보 입력하기';

  // 채권 상태가 완료(completed)이면 버튼 비활성화
  const isCompleted = account?.status === 'completed';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between">
        <h3 className="Heading-3 h-10 flex items-center">{title}</h3>

        {/* 버튼 */}
        <div className="flex gap-2">
          {!isPurchase && (
            <MiniBtn
              text="메일 보내기"
              variant="whiteOutline"
              onClick={onOpenSendEmailModal}
              disabled={isCompleted}
            />
          )}
          <MiniBtn
            text={inputButtonText}
            variant="whiteOutline"
            onClick={onOpenCreateAccountPaymentModal}
            disabled={isCompleted}
          />
        </div>
      </div>

      {/* 표 */}
      <Table isPurchase={isPurchase} taxId={taxId} type={type} />
    </div>
  );
};

export default TableArea;
