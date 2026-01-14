import { MiniBtn } from '@/ui';
import Table from './table';
import { TaxInvoiceAccountModel } from '@/types/data-model';
import { PaymentDetailResponseModel } from '@/types/data-model';
import { useTranslations } from 'next-intl';

interface TableAreaProps {
  isPurchase: boolean;
  taxId: number;
  account: TaxInvoiceAccountModel | null;
  onOpenCreateAccountPaymentModal: () => void;
  onOpenDeleteAccountPaymentModal: (paymentId: number) => void;
  onOpenEditAccountPaymentModal: (
    paymentDetail: PaymentDetailResponseModel
  ) => void;
  type?: 'tax' | 'cash-receipt';
}

const TableArea = ({
  isPurchase,
  taxId,
  account,
  onOpenCreateAccountPaymentModal,
  onOpenDeleteAccountPaymentModal,
  onOpenEditAccountPaymentModal,
  type = 'tax',
}: TableAreaProps) => {
  const t = useTranslations('tax.list.tableArea');
  const title = isPurchase ? t('title.payment') : t('title.deposit');
  const inputButtonText = isPurchase
    ? t('buttons.enterPayment')
    : t('buttons.enterDeposit');

  // 채권 상태가 완료(completed)이면 버튼 비활성화
  const isCompleted = account?.status === 'completed';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between">
        <h3 className="Heading-3 h-10 flex items-center">{title}</h3>

        {/* 버튼 */}
        <MiniBtn
          text={inputButtonText}
          variant="whiteOutline"
          onClick={onOpenCreateAccountPaymentModal}
          disabled={isCompleted}
        />
      </div>

      {/* 표 */}
      <Table
        isPurchase={isPurchase}
        taxId={taxId}
        type={type}
        onOpenDeleteAccountPaymentModal={onOpenDeleteAccountPaymentModal}
        onOpenEditAccountPaymentModal={onOpenEditAccountPaymentModal}
      />
    </div>
  );
};

export default TableArea;
