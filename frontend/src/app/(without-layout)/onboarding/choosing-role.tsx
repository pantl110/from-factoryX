import { useRouter } from 'next/navigation';

interface ChoosingRoleProps {
  onNextStep: () => void;
}

const ChoosingRole = ({ onNextStep }: ChoosingRoleProps) => {
  const router = useRouter();

  return (
    <div className="bg-wh z-1 w-[600px] py-10 px-8 flex flex-col items-center rounded-lg">
      <div className="flex flex-col gap-1 items-center">
        <h3 className="Heading-3 text-primary">
          어떤 방식으로 서비스를 시작하시겠어요?
        </h3>
        <p className="Me_Body-2 text-center">
          내 공장을 등록하거나 초대 받은 공장에 소속되어 서비스를 시작해보세요!
        </p>
      </div>

      <div className="w-full flex flex-col mt-7 gap-2">
        <button
          onClick={onNextStep}
          className="p-3 border border-lg rounded-[8px] flex flex-col gap-1 items-center justify-center hover:bg-primary-8 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <h4 className="Heading-4 text-dg">공장장으로 시작하기</h4>
          <p className="Re_Body-2 text-sv">직접 공장을 등록하고 운영해요.</p>
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="p-3 border border-lg rounded-[8px] flex flex-col gap-1 items-center justify-center hover:bg-primary-8 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <h4 className="Heading-4 text-dg">직원으로 시작하기</h4>
          <p className="Re_Body-2 text-sv">
            초대 받은 공장이 있다면 자동으로 연결돼요.
          </p>
        </button>
      </div>
    </div>
  );
};

export default ChoosingRole;
