'use client';
import { useTranslations } from 'next-intl';

const TermsOfServicePage = () => {
  const t = useTranslations('signup.termsOfService');

  return (
    <div className="px-10 pt-7 pb-10 flex flex-col gap-3">
      {/* 서비스 이용약관 */}
      <div className="flex flex-col gap-3">
        <h4 className="Heading-4 text-primary">{t('title')}</h4>
        <div>
          <div className="flex gap-2 Re_body-2 text-dg">
            <p>{t('header.announcementDate')}</p>
            <p>{t('header.announcementDateValue')}</p>
          </div>
          <div className="flex gap-2 Re_body-2 text-dg">
            <p>{t('header.effectiveDate')}</p>
            <p>{t('header.effectiveDateValue')}</p>
          </div>
          <div className="flex gap-2 Re_body-2 text-dg">
            <p>{t('header.documentVersion')}</p>
            <p>{t('header.documentVersionValue')}</p>
          </div>
        </div>
        <div className="border-t border-lg" />
        <p className="Re_body-2 text-dg">
          {t('article1.title')}
          <br />
          {t.rich('article1.paragraph1', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
          <br />
          <br />
          {t('article2.title')} <br />
          1. {t('article2.item1')}
          <br />
          2. {t('article2.item2')}
          <br />
          3. {t('article2.item3')}
          <br />
          4. {t('article2.item4')}
          <br />
          5. {t('article2.item5')}
          <br />
          6. {t('article2.item6')}
          <br />
          7. {t('article2.item7')}
          <br />
          8. {t('article2.item8')}
          <br />
          9. {t('article2.item9')}
          <br />
          10. {t('article2.item10')}
          <br />
          <br />
          {t('article3.title')} <br />
          1. {t('article3.item1')}
          <br />
          2. {t('article3.item2')}
          <br />
          3.{' '}
          {t.rich('article3.item3', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
          <br />
          4. {t('article3.item4')}
          <br />
          <br />
          {t('article4.title')} <br />
          1. {t('article4.item1')}
          <br />
          2.{' '}
          {t.rich('article4.item2', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
          <br />
          <br />
          {t('article5.title')} <br />
          1. {t('article5.item1')}
          <br />
          2. {t('article5.item2')}
          <br />
          3. {t('article5.item3')}
          <br />
          <br />
          {t('article6.title')} <br />
          1. {t('article6.item1Part1')}
          <strong>{t('article6.item1Strong')}</strong>
          {t('article6.item1Part2')}
          <br />
          2. {t('article6.item2')}
          <br />
          3. {t('article6.item3')}
          <br />
          <br />
          {t('article7.title')}
          <br />
          1. {t('article7.item1')}
          <br />
          2. {t('article7.item2Part1')}
          <strong>{t('article7.item2Strong')}</strong>
          {t('article7.item2Part2')}
          <br />
          <br />
          {t('article8.title')}
          <br />
          1.{' '}
          {t.rich('article8.item1', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
          <br />
          2.{' '}
          {t.rich('article8.item2', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
          <br />
          3. {t('article8.item3')}
          <br />
          4.{' '}
          {t.rich('article8.item4', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
          <br />
          <br />
          {t('article9.title')} <br />
          1.{' '}
          {t.rich('article9.item1', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
          <br />
          2.{' '}
          {t.rich('article9.item2', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
          <br />
          3.{' '}
          {t.rich('article9.item3', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
          <br />
          4. {t('article9.item4')}
          <br />
          <br />
          {t('article10.title')} <br />
          1.{' '}
          {t.rich('article10.item1', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
          <br />
          2. {t('article10.item2')}
          <br />
          3. {t('article10.item3')}
          <br />
          <br />
          {t('article11.title')} <br />
          1.{' '}
          {t.rich('article11.item1', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
          <br />
          2.{' '}
          {t.rich('article11.item2', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
          <br />
          3. {t('article11.item3')}
          <br />
          4.{' '}
          {t.rich('article11.item4', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
          <br />
          <br />
          {t('article12.title')} <br />
          1.{' '}
          {t.rich('article12.item1', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}{' '}
          <br />
          2.{' '}
          {t.rich('article12.item2', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
          <br />
          3. {t('article12.item3')} <br />
          <br />
          {t('article13.title')}
          <br />
          1.{' '}
          {t.rich('article13.item1', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
          <br />
          2.{' '}
          {t.rich('article13.item2', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
          <br /> <br />
          {t('article14.title')}
          <br />
          1. {t('article14.item1')}
          <br />
          2. {t('article14.item2')}
          <br />
          <br />
          {t('article15.title')}
          <br />
          1. {t('article15.item1')}
          <br />
          2.{' '}
          {t.rich('article15.item2', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
          <br />
          3.{' '}
          {t.rich('article15.item3', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
          <br />
          4.{' '}
          {t.rich('article15.item4', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}{' '}
          <br /> <br />
          <br />
          {t('article16.title')} <br />
          1. {t('article16.item1')}
          <br />
          2. {t('article16.item2')}
          <br />
          3. {t('article16.item3')}
          <br />
          <br />
          {t('article17.title')}
          <br />
          1.{' '}
          {t.rich('article17.item1', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
          <br />
          2.{' '}
          {t.rich('article17.item2', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
          <br />
          <br />
          {t('article18.title')} <br />
          1.{' '}
          {t.rich('article18.item1', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
          <br />
          2. {t('article18.item2')}
          <br />
          <br />
          {t('article19.title')} <br />
          1. {t('article19.item1')} <br />
          2.{' '}
          {t.rich('article19.item2', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}{' '}
          <br />
          3. {t('article19.item3')} <br />
          <br />
          {t('article20.title')}
          <br />
          1. {t('article20.item1')}
          <br />
          2. {t('article20.item2')}
          <br />
          <br />
          {t('article21.title')}
          <br />
          1.{' '}
          {t.rich('article21.item1', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
          <br />
          2.{' '}
          {t.rich('article21.item2', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
          <br />
          3. {t('article21.item3')}
          <br />
          4. {t('article21.item4')}
          <br />
          <br />
          {t('article22.title')} <br />
          1.{' '}
          {t.rich('article22.item1', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
          <br />
          2.{' '}
          {t.rich('article22.item2', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
          <br />
          3.{' '}
          {t.rich('article22.item3', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
          <br />
          <br />
          {t('article23.title')}
          <br />
          1. {t('article23.item1')}
          <br />
          2. {t('article23.item2')}
          <br />
          <br />
          {t('article24.title')}
          <br />
          1.{' '}
          {t.rich('article24.item1', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
          <br />
          2. {t('article24.item2')}
        </p>
        <div className="border-t border-lg" />
        <div className="flex flex-col gap-2">
          <h4 className="Heading-4 text-primary">{t('supplementary.title')}</h4>
          <div className="flex flex-col gap-1 Re_body-2 text-dg">
            <p> 1. {t('supplementary.item1')}</p>
            <p> 2. {t('supplementary.item2')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
