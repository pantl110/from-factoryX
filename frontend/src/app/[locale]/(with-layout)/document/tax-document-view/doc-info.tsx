import { InfoLabelValue } from '@/ui';
import { formatISODate } from '@/utils';
import { TaxDocumentType, TransactionType } from '@/types/status-type';

interface DocInfoProps {
  taxType: TaxDocumentType;
  publishDate: string | null;
  transactionType: TransactionType;
}

const DocInfo = ({ taxType, transactionType, publishDate }: DocInfoProps) => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 items-center flex">세금계산서 정보</h3>
      <div className="width-full border-b border-lg">
        <div className="flex">
          <InfoLabelValue label="세금계산서 구분" chip={{ status: taxType }} />
          <InfoLabelValue
            label="구분"
            value={transactionType === 'receipt' ? '영수' : '청구'}
          />
        </div>
        <InfoLabelValue label="발행일자" value={formatISODate(publishDate)} />
      </div>
    </div>
  );
};

export default DocInfo;
