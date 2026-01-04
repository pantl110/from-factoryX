import { useTranslations } from 'next-intl';

const MarketingInfoPage = () => {
  const t = useTranslations('signup.marketingInfo');

  return (
    <div className="px-10 pt-7 pb-10 flex flex-col gap-3">
      {/* 마케팅 정보 */}
      <div className="flex flex-col gap-3">
        <h4 className="Heading-4 text-primary">{t('title')}</h4>
        <p className="Re_body-2 text-dg">
          <strong>{t('section1.title')}</strong>
          <br /> {t('section1.description')}
          <br /> • {t('section1.item1')}
          <br /> • {t('section1.item2')}
          <br /> • {t('section1.item3')}
          <br />※ {t('section1.note')}
          <br />
          <br /> <strong>{t('section2.title')}</strong>
          <br /> • {t('section2.item1')}
          <br /> • {t('section2.item2')}
          <br /> • {t('section2.item3')}
          <br />
          <br /> <strong>{t('section3.title')}</strong>
          <br /> • {t('section3.item1')}
          <br /> • {t('section3.item2')}
          <br />
          <br /> <strong>{t('section4.title')}</strong>
          <br /> • {t('section4.item1')}
          <br /> • {t('section4.item2')}
          <br /> • {t('section4.item3')}
          <br /> ※ {t('section4.note')}
          <br />
          <br /> <strong>{t('section5.title')}</strong>
          <br /> • {t('section5.description')}
          <br />
          <br /> <strong>{t('section6.title')}</strong>
          <br /> • {t('section6.description')}
        </p>
      </div>
    </div>
  );
};

export default MarketingInfoPage;
