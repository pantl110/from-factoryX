import FooterText from '@/ui/footer-text';
import FactoryXLogo from '@/ui/icons/factory-x-logo';

const Footer = () => {
  return (
    <footer className="mt-10 px-10 py-5 border-t border-lg flex flex-col gap-10">
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <FooterText title="상호명" content="앰플랩 주식회사" />
          <FooterText title="사업자등록번호" content="825-86-03341" />
          <FooterText title="대표자" content="김진영" />
          <FooterText title="개인정보관리책임자" content="김진영" />
          <FooterText
            title="주소"
            content="세종특별자치시 다정중앙로 20, 112호"
          />
          <FooterText title="전화번호" content="0502-6823-5354" />
          <FooterText title="이메일" content="ceo@amplab.us" />
          <FooterText
            title="통신판매업 신고번호"
            content="제2025-세종-0541호"
          />
        </div>
        <div className="pb-4">
          <FactoryXLogo width={95} />
        </div>
      </div>
      <div className="flex justify-between gap-2">
        <FooterText title="© 팩토리엑스 2024 All Rights Reserved." />
        <FooterText title="서비스 이용약관" content="개인정보처리방침" />
      </div>
    </footer>
  );
};

export default Footer;
