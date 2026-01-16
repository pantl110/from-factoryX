import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Chip, NoHistoryBox } from '@/ui';
import MiniBtn from '@/ui/mini-btn';
import AccountItem from './account-item';
import { PublishedDocumentOutModel } from '@/types/data-model';
import { formatISODate, getDaysDiff } from '@/utils';
import { useGetPublishedDocuments } from '@/hooks';
import AccountsPanel from '@/app/[locale]/(with-layout)/tax/list/accounts-panel';

export const Account = () => {
  const router = useRouter();
  const tAccount = useTranslations('dashboard.account');
  const tCommon = useTranslations('common');
  const [selectedChip, setSelectedChip] = useState<
    'all' | 'receivable' | 'payable'
  >('all');
  const [selectedAccount, setSelectedAccount] = useState<{
    id: number;
    type: 'tax' | 'cash-receipt';
  } | null>(null);
  const { data, isLoading } = useGetPublishedDocuments(
    {
      filters: { is_hidden: false },
      ordering: 'agreed_payment_date',
      page: 1,
      page_size: 12,
    },
    { enabled: true }
  );
  const documents = useMemo(() => data?.data ?? [], [data]);
  const filteredDocuments = useMemo(() => {
    if (selectedChip === 'all') return documents;
    if (selectedChip === 'receivable') {
      return documents.filter((doc) => doc.tax_invoice_type === 'sales');
    }
    return documents.filter(
      (doc) =>
        doc.tax_invoice_type === 'purchase' || doc.document_type !== 'tax'
    );
  }, [documents, selectedChip]);
  const formatAmount = (amount: number) => amount.toLocaleString();

  return (
    <>
      <div className="flex flex-col flex-1 min-w-0 gap-3">
        {/* 타이틀 영역 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="Heading-3">{tAccount('title')}</h3>
            {/* 칩 영역 */}
            <div className="flex gap-1">
              <Chip
                text={tCommon('all')}
                textColor={selectedChip === 'all' ? 'text-bg' : 'text-dg'}
                bgColor={selectedChip === 'all' ? 'bg-dg' : 'bg-transparent'}
                borderColor="border-lg"
                cursor="cursor-pointer"
                radius="rounded-full"
                height="h-9"
                padding="px-4"
                onClick={() => setSelectedChip('all')}
              />
              <Chip
                text={tAccount('chips.receivable')}
                textColor={
                  selectedChip === 'receivable' ? 'text-bg' : 'text-primary'
                }
                bgColor={
                  selectedChip === 'receivable' ? 'bg-dg' : 'bg-transparent'
                }
                borderColor="border-lg"
                cursor="cursor-pointer"
                radius="rounded-full"
                height="h-9"
                padding="px-4"
                onClick={() => setSelectedChip('receivable')}
              />
              <Chip
                text={tAccount('chips.payable')}
                textColor={selectedChip === 'payable' ? 'text-bg' : 'text-red'}
                bgColor={
                  selectedChip === 'payable' ? 'bg-dg' : 'bg-transparent'
                }
                borderColor="border-lg"
                cursor="cursor-pointer"
                radius="rounded-full"
                height="h-9"
                padding="px-4"
                onClick={() => setSelectedChip('payable')}
              />
            </div>
          </div>

          <MiniBtn
            text={tCommon('more')}
            variant="whiteOutline"
            onClick={() => {
              router.push('/tax/list');
            }}
          />
        </div>

        <div className="flex flex-col gap-3">
          {isLoading || filteredDocuments.length === 0 ? (
            <NoHistoryBox
              title={tAccount('empty.title')}
              text={tAccount('empty.description')}
              height="h-full"
            />
          ) : (
            filteredDocuments.map((document: PublishedDocumentOutModel) => {
              const { account } = document;
              const agreedPaymentDate = account?.agreed_payment_date;
              if (!agreedPaymentDate) return null;

              const diffDays = getDaysDiff(new Date(), agreedPaymentDate);
              const isReceivable =
                document.document_type === 'tax' &&
                document.tax_invoice_type === 'sales';
              const chipText =
                diffDays >= 0 ? `D+${diffDays}` : `D-${Math.abs(diffDays)}`;
              const chipColor = isReceivable ? 'secondary' : 'red';
              const isOverdue = diffDays >= 0;
              const amount = formatAmount(
                account?.outstanding_balance || document.total_amount || 0
              );
              const label = isReceivable
                ? tAccount('labels.receivable')
                : tAccount('labels.payable');
              const clientName = document.client_name || '-';
              const description = `[${clientName}] ${label} ${amount}${tCommon('won')}`;
              const date =
                formatISODate(account?.agreed_payment_date || null) || '-';
              return (
                <AccountItem
                  key={`${document.document_type}-${document.id}`}
                  chipText={chipText}
                  chipColor={chipColor}
                  description={description}
                  date={date}
                  isOverdue={isOverdue}
                  onClick={() => {
                    setSelectedAccount({
                      id: document.id,
                      type:
                        document.document_type === 'tax'
                          ? 'tax'
                          : 'cash-receipt',
                    });
                  }}
                />
              );
            })
          )}
        </div>
      </div>
      {selectedAccount && (
        <AccountsPanel
          itemId={selectedAccount.id}
          type={selectedAccount.type}
          onClose={() => setSelectedAccount(null)}
        />
      )}
    </>
  );
};
