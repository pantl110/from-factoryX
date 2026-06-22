import FooterText from '@/ui/footer-text';
import PantlLogo from '@/ui/icons/pantl-logo';
import { useTranslations } from 'next-intl';

const Footer = () => {
  const t = useTranslations('common.footer');

  return (
    <footer className="mt-10 px-10 py-5 border-t border-lg flex flex-col gap-10">
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <FooterText
            title={t('companyName.title')}
            content={t('companyName.content')}
          />
          <FooterText
            title={t('businessRegistrationNumber.title')}
            content={t('businessRegistrationNumber.content')}
          />
          <FooterText
            title={t('representative.title')}
            content={t('representative.content')}
          />
          <FooterText
            title={t('privacyOfficer.title')}
            content={t('privacyOfficer.content')}
          />
          <FooterText
            title={t('address.title')}
            content={t('address.content')}
          />
          <FooterText title={t('phone.title')} content={t('phone.content')} />
          <FooterText title={t('email.title')} content={t('email.content')} />
          <FooterText
            title={t('telecomSalesReportNumber.title')}
            content={t('telecomSalesReportNumber.content')}
          />
        </div>
        <div className="pb-4">
          <PantlLogo width={95} />
        </div>
      </div>
      <div className="flex justify-between gap-2">
        <FooterText title={t('copyright')} />
        <FooterText title={t('termsOfService')} content={t('privacyPolicy')} />
      </div>
    </footer>
  );
};

export default Footer;
