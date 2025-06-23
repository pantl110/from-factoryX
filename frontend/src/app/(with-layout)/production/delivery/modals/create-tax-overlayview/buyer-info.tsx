import Input from "@/ui/input";

const BuyerInfo = () => {
  return (
    <div className="flex flex-col gap-5 flex-1">
      <h3 className="Heading-3">공급자 정보</h3>
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Input label="회사명" placeholder="팩토리엑스" required />
          <Input label="사업자등록번호" placeholder="123-45-67890" required />
        </div>
        <Input label="대표자명" placeholder="홍길동" required />{" "}
        <div className="flex gap-2">
          <Input label="업태" placeholder="제조업" required />
          <Input label="종목" placeholder="플라스틱 사출출" required />
        </div>
        <Input label="사업장 주소" placeholder="경기도 남양주시" />
      </div>
    </div>
  );
};

export default BuyerInfo;
