import { useTranslations } from 'next-intl';

const PrivacyPolicyPage = () => {
  const t = useTranslations('signup.privacyPolicy');

  return (
    <div className="px-10 pt-7 pb-10 flex flex-col gap-3">
      <div className="flex flex-col gap-3">
        <h4 className="Heading-4 text-primary">{t('title')}</h4>
        <div>
          <div className="flex gap-2 Re_body-2 text-dg">
            <p>{t('header.effectiveDate')}</p>
            <p>{t('header.effectiveDateValue')}</p>
          </div>
          <div className="flex gap-2 Re_body-2 text-dg">
            <p>{t('header.firstPublishedDate')}</p>
            <p>{t('header.firstPublishedDateValue')}</p>
          </div>
          <div className="flex gap-2 Re_body-2 text-dg">
            <p>{t('header.documentVersion')}</p>
            <p>{t('header.documentVersionValue')}</p>
          </div>
          <div className="flex gap-2 Re_body-2 text-dg">
            <p>{t('header.companyName')}</p>
            <p>{t('header.companyNameValue')}</p>
          </div>
          <div className="flex gap-2 Re_body-2 text-dg">
            <p>{t('header.businessRegistrationNumber')}</p>
            <p>{t('header.businessRegistrationNumberValue')}</p>
          </div>
          <div className="flex gap-2 Re_body-2 text-dg">
            <p>{t('header.address')}</p>
            <p>{t('header.addressValue')}</p>
          </div>
          <div className="flex gap-2 Re_body-2 text-dg">
            <p>{t('header.contact')}</p>
            <p>{t('header.contactValue')}</p>
          </div>
          <div className="flex gap-2 Re_body-2 text-dg">
            <p>{t('header.email')}</p>
            <p>{t('header.emailValue')}</p>
          </div>
          <div className="flex gap-2 Re_body-2 text-dg">
            <p>{t('header.privacyOfficer')}</p>
            <p>{t('header.privacyOfficerValue')}</p>
          </div>
        </div>
        <div className="border-t border-lg" />
        <p className="Re_body-2 text-dg">
          {t('article1.title')}
          <br />
          {t('article1.paragraph1')} <strong>{t('article1.factoryX')}</strong>{' '}
          {t('article1.paragraph1Continued')}
          <br />
          {t('article1.paragraph2')}
          <br />
          <br />
          {t('article2.title')}
          <br />
          <strong>{t('article2.section1Title')}</strong>
          <br />
          <span className="ml-4">• {t('article2.section1Item1')}</span>
          <br />
          <span className="ml-4">• {t('article2.section1Item2')}</span>
          <br />
          <span className="ml-4">• {t('article2.section1Item3')}</span>
          <br />
          <span className="ml-4">• {t('article2.section1Item4')}</span>
          <br />
          <strong>{t('article2.section2Title')}</strong>
          <br />
          <span className="ml-4">• {t('article2.section2Item1')}</span>
          <br />
          <span className="ml-4">• {t('article2.section2Item2')}</span>
          <br />
          <span className="ml-4">• {t('article2.section2Item3')}</span>
          <br />
          <span className="ml-4">
            • <strong>{t('article2.section2Item4')}</strong>{' '}
            {t('article2.section2Item4Continued')}
          </span>
          <br />
          <br />
          {t('article3.title')}
          <br />
          {t('article3.paragraph')}
          <br />
          <strong>1. {t('article3.item1')}</strong>
          <br />
          <strong>2. {t('article3.item2')}</strong>
          <br />
          <strong>3. {t('article3.item3')}</strong>
          <br />
          <strong>4. {t('article3.item4')}</strong>
          <br />
          <strong>5. {t('article3.item5')}</strong>
          <br />
          <strong>6. {t('article3.item6')}</strong>
          <br />
          <strong>7. {t('article3.item7')}</strong>
        </p>
        <p className="Re_body-2 text-dg">
          {t('article4.title')}
          <br />• {t('article4.paragraph1')}
          <br />• {t('article4.paragraph2')}
        </p>
        <div>
          <div className="flex h-9 px-3 bg-bg text-sv Re_body-3 items-center">
            <p className="flex-1">{t('article4.table.header.item')}</p>
            <p className="flex-1">{t('article4.table.header.basis')}</p>
            <p className="flex-1">{t('article4.table.header.period')}</p>
          </div>
          <div className="flex h-[35px] px-3 border-b border-bg text-dg Re_body-3 items-center">
            <p className="flex-1">{t('article4.table.row1.item')}</p>
            <p className="flex-1">{t('article4.table.row1.basis')}</p>
            <p className="flex-1">{t('article4.table.row1.period')}</p>
          </div>
          <div className="flex h-[35px] px-3 border-b border-bg text-dg Re_body-3 items-center">
            <p className="flex-1">{t('article4.table.row2.item')}</p>
            <p className="flex-1">{t('article4.table.row2.basis')}</p>
            <p className="flex-1">{t('article4.table.row2.period')}</p>
          </div>
          <div className="flex h-[35px] px-3 border-b border-bg text-dg Re_body-3 items-center">
            <p className="flex-1">{t('article4.table.row3.item')}</p>
            <p className="flex-1">{t('article4.table.row3.basis')}</p>
            <p className="flex-1">{t('article4.table.row3.period')}</p>
          </div>
          <div className="flex h-[35px] px-3 border-b border-bg text-dg Re_body-3 items-center">
            <p className="flex-1">{t('article4.table.row4.item')}</p>
            <p className="flex-1">{t('article4.table.row4.basis')}</p>
            <p className="flex-1">{t('article4.table.row4.period')}</p>
          </div>
        </div>
        <p className="Re_body-2 text-dg">
          {t('article5.title')}
          <br />
          1. {t('article5.paragraph1')}
          <br />
          2. {t('article5.paragraph2')}{' '}
          <strong>{t('article5.processing')}</strong>{' '}
          {t('article5.paragraph2Continued')}
          <br />• {t('article5.paragraph3')}
        </p>
        <div>
          <div className="flex h-9 px-3 bg-bg text-sv Re_body-3 items-center">
            <p className="flex-1">{t('article5.table.header.trustee')}</p>
            <p className="flex-1">{t('article5.table.header.task')}</p>
            <p className="flex-1">{t('article5.table.header.country')}</p>
            <p className="flex-[0.6]">
              {t('article5.table.header.retentionPeriod')}
            </p>
            <p className="flex-1">{t('article5.table.header.protection')}</p>
          </div>
          <div className="flex h-[35px] px-3 border-b border-bg text-dg Re_body-3 items-center">
            <p className="flex-1">{t('article5.table.row1.trustee')}</p>
            <p className="flex-1">{t('article5.table.row1.task')}</p>
            <p className="flex-1">{t('article5.table.row1.country')}</p>
            <p className="flex-[0.6]">
              {t('article5.table.row1.retentionPeriod')}
            </p>
            <p className="flex-1">{t('article5.table.row1.protection')}</p>
          </div>
          <div className="flex h-[35px] px-3 border-b border-bg text-dg Re_body-3 items-center">
            <p className="flex-1">{t('article5.table.row2.trustee')}</p>
            <p className="flex-1">{t('article5.table.row2.task')}</p>
            <p className="flex-1">{t('article5.table.row2.country')}</p>
            <p className="flex-[0.6]">
              {t('article5.table.row2.retentionPeriod')}
            </p>
            <p className="flex-1">{t('article5.table.row2.protection')}</p>
          </div>
          <div className="flex h-[35px] px-3 border-b border-bg text-dg Re_body-3 items-center">
            <p className="flex-1">{t('article5.table.row3.trustee')}</p>
            <p className="flex-1">{t('article5.table.row3.task')}</p>
            <p className="flex-1">{t('article5.table.row3.country')}</p>
            <p className="flex-[0.6]">
              {t('article5.table.row3.retentionPeriod')}
            </p>
            <p className="flex-1">{t('article5.table.row3.protection')}</p>
          </div>
          <div className="flex h-[35px] px-3 border-b border-bg text-dg Re_body-3 items-center">
            <p className="flex-1">{t('article5.table.row4.trustee')}</p>
            <p className="flex-1">{t('article5.table.row4.task')}</p>
            <p className="flex-1">{t('article5.table.row4.country')}</p>
            <p className="flex-[0.6]">
              {t('article5.table.row4.retentionPeriod')}
            </p>
            <p className="flex-1">{t('article5.table.row4.protection')}</p>
          </div>
          <div className="flex h-[35px] px-3 border-b border-bg text-dg Re_body-3 items-center">
            <p className="flex-1">{t('article5.table.row5.trustee')}</p>
            <p className="flex-1">{t('article5.table.row5.task')}</p>
            <p className="flex-1">{t('article5.table.row5.country')}</p>
            <p className="flex-[0.6]">
              {t('article5.table.row5.retentionPeriod')}
            </p>
            <p className="flex-1">{t('article5.table.row5.protection')}</p>
          </div>
        </div>
        <p className="Re_body-2 text-dg">
          {t('article6.title')}
          <br />
          1. {t('article6.paragraph1')} <strong>{t('article6.rights')}</strong>{' '}
          {t('article6.paragraph1Continued')}
          <br /> 2. {t('article6.paragraph2')}(
          <a href="mailto:ceo@amplab.us" className="text-primary underline">
            {t('article6.emailLink')}
          </a>
          ){t('article6.paragraph2Continued')}{' '}
          <strong>{t('article6.processingTime')}</strong>
          {t('article6.paragraph2Continued2')}
          <br /> 3. {t('article6.paragraph3')}
          <br />
          <span className="ml-4">• {t('article6.item1')}</span>
          <br />
          <span className="ml-4">• {t('article6.item2')}</span>
          <br />
          <br />
          {t('article7.title')}
          <br />
          1. {t('article7.paragraph1')}
          <br />
          2. {t('article7.paragraph2')}
          <br />
          3. {t('article7.paragraph3')}
          <br />
          <br />
          {t('article8.title')}
          <br />• {t('article8.paragraph1')}
          <br />• {t('article8.paragraph2')}
          <br />• {t('article8.paragraph3')}
          <br />
          <br />
          {t('article9.title')}
          <br />
          {t('article9.paragraph')}
          <br />
          <strong>1. {t('article9.item1')}</strong>
          {t('article9.item1Description')}
          <br />
          <strong>2. {t('article9.item2')}</strong>
          {t('article9.item2Description')}
          <br />
          <strong>3. {t('article9.item3')}</strong>
          {t('article9.item3Description')}
          <br />
          <strong>4. {t('article9.item4')}</strong>
          {t('article9.item4Description')}
          <br />
          <br />
          {t('article10.title')}
          <br />• {t('article10.paragraph1')}
          <br />• {t('article10.paragraph2')}
          <br />
          <br />
          {t('article11.title')}
          <br />• {t('article11.paragraph1')}{' '}
          <strong>{t('article11.noPersonalDecision')}</strong>
          <br />• {t('article11.paragraph2')}
          <br />
          <br />
          {t('article12.title')}
          <br />• {t('article12.paragraph1')}{' '}
          <strong>{t('article12.awsRegions')}</strong>{' '}
          {t('article12.paragraph1Continued')}
          <br />• {t('article12.paragraph2')}
          <br />
          <br />
          {t('article13.title')}
          <br />• <strong>{t('article13.dpo')}</strong>
          {t('article13.dpoValue')}
          <br />• <strong>{t('article13.contact')}</strong>{' '}
          {t('article13.contactValue')}{' '}
          <a href="mailto:ceo@amplab.us" className="text-primary underline">
            {t('article13.emailLink')}
          </a>
          <br />• <strong>{t('article13.address')}</strong>
          {t('article13.addressValue')}
          <br />• {t('article13.paragraph')}(
          <a
            href="https://privacy.kisa.or.kr"
            className="text-primary underline"
            target="_blank"
          >
            {t('article13.kisaLink')}
          </a>
          ){t('article13.paragraphContinued')}
          <br />
          <br />
          {t('article14.title')}
          <br />
          1. {t('article14.paragraph1')}
          <br />
          2. {t('article14.paragraph2')}
          <br />
          3. {t('article14.paragraph3')}
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

export default PrivacyPolicyPage;
