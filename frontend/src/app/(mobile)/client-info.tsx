import { TaxClientInfoModel } from '@/types/data-model';
import { LabelInfo } from './label-info';

interface ClientInfoProps {
  clientInfo?: TaxClientInfoModel | null;
}

const ClientInfo = ({ clientInfo }: ClientInfoProps) => {
  return (
    <div className="px-7 py-8 flex flex-col gap-8">
      <h3 className="m-Heading-3-semibold">거래처 정보</h3>
      <div className="flex flex-col gap-5">
        <LabelInfo label="거래처명" value={clientInfo?.name || '-'} />
        <LabelInfo
          label="사업자등록번호"
          value={clientInfo?.business_registration_number || '-'}
        />
        <LabelInfo
          label="대표자명"
          value={clientInfo?.representative_name || '-'}
        />
        <LabelInfo label="업태" value={clientInfo?.business_type || '-'} />
        <LabelInfo label="종목" value={clientInfo?.business_category || '-'} />
        <div className="h-[1px] bg-bg" />
        <LabelInfo label="담당자명" value={clientInfo?.manager || '-'} />
        <LabelInfo label="이메일" value={clientInfo?.email || '-'} />
        <LabelInfo label="연락처" value={clientInfo?.phone || '-'} />
        <LabelInfo label="팩스번호" value={clientInfo?.fax || '-'} />
      </div>
    </div>
  );
};

export default ClientInfo;
