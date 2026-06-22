import InfoDetail from '../info-detail';
import { LabelInfo } from '../label-info';
import MoBtn from '@/ui/mo-btn';
import { CaretRight } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import {
  TaxInvoiceAccountModel,
  PaymentDetailListResponseModel,
} from '@/types/data-model';
import {
  AccountsStatusColorMap,
  AccountsStatusType,
  CollectionTermsType,
} from '@/types/status-type';
import MoChip from '@/ui/mo-chip';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { formatISODate, getDaysUntilPayment } from '@/utils';
import { useRouter } from '@/i18n/navigation';

interface AccountInfoProps {
  type: string;
  account?: TaxInvoiceAccountModel | null;
}

const AccountInfo = ({ type, account }: AccountInfoProps) => {
  const tTax = useTranslations('tax.list.info');
  const tList = useTranslations('tax.list');
  const tTableArea = useTranslations('tax.list.tableArea');
  const tAccountPayment = useTranslations('tax.list.accountPayment.labels');
  const tClient = useTranslations('setting.masterData.client');
  const tCommon = useTranslations('common');
  const tMobile = useTranslations('mobile.account');
  const router = useRouter();

  const accountStatus = account?.status as AccountsStatusType | undefined;
  const statusColorMap = accountStatus
    ? AccountsStatusColorMap[accountStatus]
    : null;

  const statusChip =
    accountStatus && statusColorMap ? (
      <MoChip
        text={tList(`status.${accountStatus}`)}
        variant={
          statusColorMap.color === 'red'
            ? 'red-secondary'
            : statusColorMap.color === 'orange'
              ? 'orange'
              : statusColorMap.color === 'blue'
                ? 'secondary'
                : 'outline'
        }
        small
      />
    ) : null;

  // 약정 입금일까지 남은/지난 일수
  const daysUntilPayment = getDaysUntilPayment(
    account?.agreed_payment_date || null
  );

  // D+ (연체) 상태일 때 연체 칩 생성
  const overdueChip =
    daysUntilPayment && daysUntilPayment.startsWith('D+') ? (
      <MoChip text={daysUntilPayment} variant="red-secondary" small />
    ) : null;

  // 상태 칩과 연체 칩을 함께 표시
  const chips = (
    <>
      {statusChip}
      {overdueChip}
    </>
  );

  // Payment details API 호출
  // tax_invoice 또는 cash_receipt의 ID를 사용해야 함
  const taxInvoiceId =
    account?.tax_invoice?.id || account?.cash_receipt?.id || null;
  const paymentType = account?.tax_invoice ? 'tax' : 'cash-receipt';

  const {
    data: paymentDetailsData,
    isLoading: isLoadingPaymentDetails,
    error: paymentDetailsError,
  } = useQuery({
    queryKey: ['payment-details', taxInvoiceId, paymentType, 1, 10],
    enabled: !!taxInvoiceId && !!account,
    queryFn: async () => {
      if (!taxInvoiceId) {
        return null;
      }

      const queryParams = new URLSearchParams({
        page: '1',
        page_size: '10',
        type: paymentType,
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v2/account-payment/${taxInvoiceId}?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        // 404는 데이터가 없는 정상 상태로 처리
        if (response.status === 404) {
          return null;
        }
        // 다른 에러는 throw
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          (errorData as { detail?: string })?.detail ||
          '회수/지급 상세내역 조회에 실패했습니다.';
        throw new Error(errorMessage);
      }

      const data: PaymentDetailListResponseModel = await response.json();
      return data;
    },
  });

  const paymentDetails = useMemo(
    () => paymentDetailsData?.data || [],
    [paymentDetailsData]
  );

  // 약정 입금일
  const agreedPaymentDate: string = account?.agreed_payment_date
    ? formatISODate(account.agreed_payment_date)
    : '-';

  // 청구금액(합계)
  const totalBilledAmount = account?.total_billed_amount
    ? `${account.total_billed_amount.toLocaleString()}원`
    : '0원';

  // 결제 조건
  const getCollectionTermDisplay = (
    term: CollectionTermsType | null,
    customTerm: string | null
  ): string => {
    if (!term) return '-';
    if (term === 'CUSTOM') {
      return customTerm || '-';
    }
    if (term === 'INVOICE_30') {
      return tTax('terms.invoice30');
    }
    if (term === 'INVOICE_EOM_NEXT') {
      return tTax('terms.invoiceEomNext');
    }
    return '-';
  };

  const collectionTermDisplay = getCollectionTermDisplay(
    account?.collection_terms || null,
    account?.collection_terms_custom || null
  );

  // 미수금액(잔액)
  const outstandingBalance = account?.outstanding_balance
    ? `${account.outstanding_balance.toLocaleString()}원`
    : '0원';

  // 청구서 발송 횟수
  const invoiceSentCount = account?.invoice_sent_count ?? 0;
  const invoiceSentText =
    invoiceSentCount === 0
      ? tTax('invoiceSent.notSent')
      : tTax('invoiceSent.sentCount', { count: invoiceSentCount });
  // 채권채무관리 판넬과 동일하게: 0이면 gray(text-dg), 그 외는 secondary(text-primary)
  const invoiceSentColor = invoiceSentCount === 0 ? 'text-dg' : 'text-primary';

  return (
    <div className="px-7 py-8 flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h3 className="m-Heading-3-semibold">
          {type === 'income' ? tTax('title.sales') : tTax('title.purchase')}
        </h3>
        {type === 'income' && (
          <MoBtn
            text={tMobile('sendPaymentRequest')}
            variant="outline"
            onClick={() => {
              // 세금계산서 ID 또는 현금영수증 ID 사용
              const taxId =
                account?.tax_invoice?.id || account?.cash_receipt?.id;
              if (taxId) {
                router.push(`/mail?taxId=${taxId}`);
              }
            }}
          />
        )}
      </div>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          <LabelInfo
            label={
              type === 'income'
                ? tTax('statusLabel.sales')
                : tTax('statusLabel.purchase')
            }
            chip={statusChip || overdueChip ? chips : undefined}
          />
          <InfoDetail
            label={tAccountPayment('expectedDepositDate')}
            value={agreedPaymentDate}
          />
          {type === 'income' && (
            <InfoDetail
              label={tTax('labels.invoiceSent')}
              value={invoiceSentText}
              valueColor={invoiceSentColor}
            />
          )}
        </div>
        <LabelInfo
          label={tTax('labels.totalBilledAmount')}
          value={totalBilledAmount}
        />
        {type === 'income' ? (
          <div className="flex flex-col gap-4">
            <LabelInfo label={tClient('depositorInfo.title')} />
            <InfoDetail
              label={tClient('depositorInfo.depositorName')}
              value="-"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <LabelInfo label={tClient('accountInfo.title')} />
            <InfoDetail label={tClient('accountInfo.bankName')} value="-" />
            <InfoDetail
              label={tClient('accountInfo.accountNumber')}
              value="-"
            />
            <InfoDetail label={tClient('accountInfo.holder')} value="-" />
          </div>
        )}
        <div className="flex flex-col gap-4">
          <LabelInfo
            label={
              type === 'income'
                ? tTableArea('table.recentDate.deposit')
                : tTableArea('table.recentDate.payment')
            }
          />
          {!taxInvoiceId ? (
            <div className="text-center py-4 text-sv">
              {tList('invoiceInfoNotFound')}
            </div>
          ) : isLoadingPaymentDetails ? (
            <div className="text-center py-4 text-sv">{tCommon('loading')}</div>
          ) : paymentDetailsError ? (
            <div className="text-center py-4 text-sv">
              {type === 'income'
                ? tTableArea('table.empty.loadFailed.deposit')
                : tTableArea('table.empty.loadFailed.payment')}
            </div>
          ) : paymentDetails.length === 0 ? (
            <div className="text-center py-4 text-sv">
              {type === 'income'
                ? tTableArea('table.empty.deposit')
                : tTableArea('table.empty.payment')}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {paymentDetails.map((payment) => (
                <InfoDetail
                  key={payment.id}
                  label={formatISODate(payment.payment_date) || '-'}
                  value={`${payment.amount_received.toLocaleString()}원`}
                />
              ))}
            </div>
          )}
        </div>
        <div className="h-[1px] bg-bg" />
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <h4 className="m-Heading-4b">
              {type === 'income'
                ? tTax('labels.amountReceivable')
                : tTax('labels.amountPayable')}
            </h4>
            <span className="m-Heading-3-semibold text-primary">
              {outstandingBalance}
            </span>
          </div>
          <p className="flex justify-end m-Body-2 text-sv">
            {collectionTermDisplay}
          </p>
        </div>
        <div className="h-[1px] bg-bg" />
      </div>

      {/* info */}
      <div className="flex flex-col gap-2 px-2 py-3 bg-bg rounded-[8px]">
        {/* <div className="flex gap-2 items-center">
          <div className="w-1.5 h-1.5 bg-lg rounded-full" />
          <h3 className="m-Body-4 text-primary">
            {type === 'income' ? '입금일' : '지급일'} 관련 정보는 PC 버전에서만
            입력 가능합니다.
          </h3>
        </div> */}
        <div className="flex gap-2 items-center">
          <div className="w-1.5 h-1.5 bg-lg rounded-full" />
          <h3 className="m-Body-4 text-primary">
            {tMobile('taxInvoicePcOnly', {
              type: type === 'income' ? tMobile('sales') : tMobile('purchase'),
            })}
          </h3>
        </div>
      </div>

      {/* 버튼 */}
      {type === 'income' && account?.tax_invoice?.project_id && (
        <MoBtn
          text={tMobile('viewDeliveryDetail')}
          variant="outline"
          icon={<CaretRight />}
          width="w-full"
          onClick={() => {
            const projectId = account?.tax_invoice?.project_id;
            if (projectId) {
              router.push(`/delivery/${projectId}/`);
            }
          }}
        />
      )}
    </div>
  );
};

export default AccountInfo;
