const MarketingInfoPage = () => {
  return (
    <div className="px-10 pt-7 pb-10 flex flex-col gap-3">
      {/* 마케팅 정보 */}
      <div className="flex flex-col gap-3">
        <h4 className="Heading-4 text-primary">
          마케팅 정보 수집 및 광고성 정보 제공 동의
        </h4>
        <p className="Re_body-2 text-dg">
          <strong>1. 수집·이용 목적</strong>
          <br /> 회사는 아래 목적을 위해 선택적으로 이용자의 개인정보를 이용할
          수 있습니다.
          <br /> • 서비스 관련 소식, 신제품/신규 기능/이벤트/프로모션 안내
          <br /> • 뉴스레터, 웨비나, 산업 트렌드 및 리포트 제공
          <br /> • 고객 맞춤형 콘텐츠·광고 발송 및 이용 통계 분석
          <br />※ 이 항목은 선택사항이며, 동의하지 않더라도 서비스 이용에는
          제한이 없습니다.
          <br />
          <br /> <strong>2. 수집·이용 항목</strong>
          <br /> • 이름, 직함, 회사명
          <br /> • 이메일 주소, 휴대폰 번호
          <br /> • 서비스 이용기록, 접속 로그, 쿠키(마케팅 분석 목적에 한함)
          <br />
          <br /> <strong>3. 보유 및 이용기간</strong>
          <br /> • 동의일로부터 2년간 또는 이용자가 수신 거부 시점까지
          보유·이용합니다.
          <br /> • 수신 거부 또는 동의 철회 시, 관련 정보는 즉시 삭제되며 이후
          발송되지 않습니다.
          <br />
          <br /> <strong>4. 수신 거부 방법</strong>
          <br /> • 이메일 하단의 “수신거부(Unsubscribe)” 버튼 클릭
          <br /> • 또는 [마이페이지 → 알림 설정 → 마케팅 정보 수신 거부]
          <br /> • 또는 이메일(ceo@amplab.us)로 요청
          <br /> ※ 수신 거부 이후에도 거래·계약 관련 공지, 결제·보안·정책 변경
          등 필수 안내는 발송될 수 있습니다.
          <br />
          <br /> <strong>5. 제3자 제공 없음</strong>
          <br /> • 회사는 이용자의 사전 동의 없이 광고성 정보 발송 목적의
          개인정보를 제3자에게 제공하지 않습니다.
          <br />
          <br /> <strong>6. 동의 철회</strong>
          <br /> • 이용자는 언제든 위 연락처를 통해 동의를 철회할 수 있으며,
          철회 이전의 발송 내역에는 영향을 미치지 않습니다.
        </p>
      </div>
    </div>
  );
};

export default MarketingInfoPage;
