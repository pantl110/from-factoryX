import Input from '@/ui/input';

const ClientInfo = () => {
  return (
    <div className="flex-1 flex flex-col gap-5">
      <h3 className="Heading-3">거래처 정보</h3>
      <form className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Input label="업체명" required placeholder="업체명을 입력하세요." />
          <Input
            label="사업자등록번호"
            required
            placeholder="사업자등록번호를 입력하세요."
          />
        </div>
        <Input label="대표자명" required placeholder="대표자명을 입력하세요." />
        <div className="flex gap-2">
          <Input label="업태" required placeholder="업태를 입력하세요." />
          <Input label="종목" required placeholder="종목을 입력하세요." />
        </div>
        <Input label="사업장 주소" placeholder="사업장 주소를 입력하세요." />
      </form>
    </div>
  );
};

export default ClientInfo;
