import InfoLabelValue from "@/ui/info-label-value";

const ClientInfoTable = () => {
  return (
    <div className="mb-11">
      <h3 className="Heading-3 text-dg mb-3">거래처 정보</h3>
      <div className="flex flex-col items-center">
        <div className="flex w-full border-t border-b border-lg">
          <InfoLabelValue label="거래처명" value="플라스틱이 좋아" />
          <InfoLabelValue label="사업자등록번호" value="123-45-67890" />
        </div>
        <div className="flex w-full border-b border-lg">
          <InfoLabelValue label="대표자명" value="홍길동" />
          <InfoLabelValue label="담당자 이메일" value="company@mail.com" />
        </div>
        <div className="flex w-full border-b border-lg">
          <InfoLabelValue label="담당자 연락처" value="010-1234-5678" />
          <InfoLabelValue label="팩스번호" value="02-123-4567" />
        </div>
        <div className="flex w-full border-b border-lg">
          <InfoLabelValue label="업태" value="제조업" />
          <InfoLabelValue label="종목" value="사출성형" />
        </div>
        <div className="flex w-full border-b border-lg">
          <InfoLabelValue
            label="사업장 주소"
            value="서울특별시 금천구 가산로 123, 5층"
          />
        </div>
        <div className="flex w-full border-b border-lg">
          <InfoLabelValue label="거래일자" value="2025-06-11" />
          <InfoLabelValue label="문서 상태" chip={{ status: "충분" }} />
        </div>
        <div className="flex w-full border-b border-lg">
          <InfoLabelValue
            label="비고"
            value="여기는 비고에 대해 적는 공간입니다.여기는 비고에 대해 적는 공간입니다.여기는 비고에 대해 적는 공간입니다.여기는 비고에 대해 적는 공간입니다.여기는 비고에 대해 적는 공간입니다.여기는 비고에 대해 적는 공간입니다.여기는 비고에 대해 적는 공간입니다.여기는 비고에 대해 적는 공간입니다.여기는 비고에 대해 적는 공간입니다.여기는 비고에 대해 적는 공간입니다.여기는 비고에 대해 적는 공간입니다.여기는 비고에 대해 적는 공간입니다."
          />
        </div>
      </div>
    </div>
  );
};

export default ClientInfoTable;
