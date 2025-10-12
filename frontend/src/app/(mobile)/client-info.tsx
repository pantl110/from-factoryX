import { LabelInfo } from './label-info';

const ClientInfo = () => {
  return (
    <div className="px-7 py-8 flex flex-col gap-8">
      <h3 className="m-Heading-3-semibold">거래처 정보</h3>
      <div className="flex flex-col gap-5">
        <LabelInfo label="업체명" value="플라스틱이 좋아" />
        <LabelInfo label="사업자등록번호" value="123-45-67890" />
        <LabelInfo label="대표자명" value="홍길동" />
        <LabelInfo label="업태" value="제조업" />
        <LabelInfo label="종목" value="플라스틱 사출" />
        <div className="h-[1px] bg-bg" />
        <LabelInfo label="담당자명" value="김철수" />
        <LabelInfo label="이메일" value="company@mail.com" />
        <LabelInfo label="연락처" value="010-1234-5678" />
        <LabelInfo label="팩스번호" value="-" />
      </div>
    </div>
  );
};

export default ClientInfo;
