import MiniBtn from '@/ui/mini-btn';
import { useTranslations } from 'next-intl';

interface ThirdStepProps {
  onNextStep: () => void;
  onPrevStep: () => void;
}

const ThirdStep = ({ onNextStep, onPrevStep }: ThirdStepProps) => {
  const t = useTranslations('onboarding.thirdStep');
  const tFirstStep = useTranslations('onboarding.firstStep');

  return (
    <div className="bg-wh z-1 w-[586px] py-10 px-8 flex flex-col gap-4 items-center rounded-lg">
      {/* 컨텐츠 영역 */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-1 items-center">
          <h3 className="Heading-3 text-primary">{t('title')}</h3>
          <div className="Me_Body-2 text-bl text-center">
            {t('description.part1')}
            {t('description.part2') && (
              <>
                <br />
                {t('description.part2')}
              </>
            )}
            <br />
            {t('description.part3')}
            <br />
            <br />
            {t('description.part4')}{' '}
            <span className="text-primary">{t('description.highlight')}</span>{' '}
            {t('description.part5')}
            <br />
            {t('description.part6')}
          </div>
        </div>
      </div>

      {/* 모달버튼 영역 */}
      <div className="w-full flex justify-end gap-2.5">
        <MiniBtn
          text={tFirstStep('buttons.previous')}
          variant="gray"
          onClick={onPrevStep}
        />
        <MiniBtn
          text={t('buttons.start')}
          variant="primary"
          onClick={onNextStep}
        />
      </div>
    </div>
  );
};

export default ThirdStep;
