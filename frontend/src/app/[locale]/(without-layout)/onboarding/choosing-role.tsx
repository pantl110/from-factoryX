import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

interface ChoosingRoleProps {
  onNextStep: () => void;
}

const ChoosingRole = ({ onNextStep }: ChoosingRoleProps) => {
  const router = useRouter();
  const t = useTranslations('onboarding.choosingRole');

  return (
    <div className="bg-wh z-1 w-[600px] py-10 px-8 flex flex-col items-center rounded-lg">
      <div className="flex flex-col gap-1 items-center">
        <h3 className="Heading-3 text-primary">{t('title')}</h3>
        <p className="Me_Body-2 text-center">{t('subtitle')}</p>
      </div>

      <div className="w-full flex flex-col mt-7 gap-2">
        <button
          onClick={onNextStep}
          className="p-3 border border-lg rounded-[8px] flex flex-col gap-1 items-center justify-center hover:bg-primary-8 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <h4 className="Heading-4 text-dg">{t('owner.title')}</h4>
          <p className="Re_Body-2 text-sv">{t('owner.description')}</p>
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="p-3 border border-lg rounded-[8px] flex flex-col gap-1 items-center justify-center hover:bg-primary-8 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <h4 className="Heading-4 text-dg">{t('employee.title')}</h4>
          <p className="Re_Body-2 text-sv">{t('employee.description')}</p>
        </button>
      </div>
    </div>
  );
};

export default ChoosingRole;
