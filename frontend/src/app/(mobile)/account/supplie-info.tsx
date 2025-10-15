import { LabelInfo } from '../label-info';

const SupplierInfo = () => {
  return (
    <div className="px-7 py-8 flex flex-col gap-8">
      <h3 className="m-Heading-3-semibold">구매처 정보</h3>
      <div className="flex flex-col gap-5">
        <LabelInfo label="업체명" value="한빛전자" />
        <LabelInfo label="사업자등록번호" value="204-85-12345" />
        <LabelInfo label="대표자명" value="이정훈" />
        <LabelInfo label="업태" value="도소매업" />
        <LabelInfo label="종목" value="전자부품 판매" />
        <div className="h-[1px] bg-bg" />
        <LabelInfo label="담당자명" value="박민수" />
        <LabelInfo label="이메일" value="minsu@mail.com" />
        <LabelInfo label="연락처" value="010-2222-5678" />
        <LabelInfo label="팩스번호" value="02-345-6789" />
      </div>
    </div>
  );
};

export default SupplierInfo;
