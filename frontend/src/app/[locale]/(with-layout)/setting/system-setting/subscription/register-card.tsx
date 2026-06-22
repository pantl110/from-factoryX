import MiniBtn from '@/ui/mini-btn';
import { PaymentAuthModel } from '@/types/data-model';
import useMemberStore from '@/store/member-store';
import { useTranslations } from 'next-intl';

interface RegisterCardProps {
  paymentAuth: PaymentAuthModel | null;
  registerCard: () => void;
  setIsChangeModalOpen: (isOpen: boolean) => void;
  setIsCardDeleteModalOpen: (isOpen: boolean) => void;
}

const RegisterCard = ({
  paymentAuth,
  registerCard,
  setIsChangeModalOpen,
  setIsCardDeleteModalOpen,
}: RegisterCardProps) => {
  const t = useTranslations('setting.systemSetting.subscription.registerCard');
  const role = useMemberStore((state) => state.role);
  const isAdmin = role === 'admin';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between">
        <h3 className="Heading-3">{t('title')}</h3>
        <MiniBtn
          text={paymentAuth?.billing_key ? t('changeCard') : t('addCard')}
          variant="outline"
          onClick={
            paymentAuth?.billing_key
              ? () => setIsChangeModalOpen(true)
              : registerCard
          }
          disabled={!isAdmin}
        />
      </div>

      <div className="flex items-center justify-between h-18 py-4 px-6 border border-lg rounded-xl">
        {paymentAuth?.billing_key ? (
          <>
            <h4 className="Heading-4">
              {paymentAuth?.card_company} {paymentAuth?.card_number}
            </h4>
            <MiniBtn variant="red"
              text={t('delete')}
              onClick={() => setIsCardDeleteModalOpen(true)}
              disabled={!isAdmin}
            />
          </>
        ) : (
          <p className="Me_Body-2 text-gr text-center w-full">{t('noCard')}</p>
        )}
      </div>
    </div>
  );
};

export default RegisterCard;
