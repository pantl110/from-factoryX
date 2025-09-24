import MiniBtn from '@/ui/mini-btn';
import { PaymentAuthModel } from '@/types/data-model';

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
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between">
        <h3 className="Heading-3">결제 카드 설정</h3>
        <MiniBtn
          text={paymentAuth?.billing_key ? '카드 변경 ' : '카드 추가'}
          variant="whiteOutline"
          onClick={
            paymentAuth?.billing_key
              ? () => setIsChangeModalOpen(true)
              : registerCard
          }
        />
      </div>

      <div className="flex items-center justify-between h-18 py-4 px-6 border border-lg rounded-xl">
        {paymentAuth?.billing_key ? (
          <>
            <h4 className="Heading-4">
              {paymentAuth?.card_company} {paymentAuth?.card_number}
            </h4>
            <MiniBtn
              text="삭제"
              textColor="text-red"
              bgColor="bg-red-8"
              hoverColor="hover:bg-red-hover"
              onClick={() => setIsCardDeleteModalOpen(true)}
            />
          </>
        ) : (
          <p className="Me_Body-2 text-gr text-center w-full">
            등록된 결제 카드가 없습니다.
          </p>
        )}
      </div>
    </div>
  );
};

export default RegisterCard;
