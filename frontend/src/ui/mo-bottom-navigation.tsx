import MoBtn from './mo-btn';
import { useRouter } from 'next/navigation';

interface MoBottomNavigationProps {
  type: 'income' | 'outcome' | 'delivery' | 'scan';
  onClick: () => void;
  onConfirm?: () => void;
}

const MoBottomNavigation = ({
  type,
  onClick,
  onConfirm,
}: MoBottomNavigationProps) => {
  const router = useRouter();
  return (
    <div className="fixed bottom-0 z-30 w-full bg-wh px-3 pt-5 pb-6 border-t border-bg shadow-[0px_1px_22px_0px_rgba(0,0,0,0.06)] flex flex-col gap-2">
      {type === 'scan' && (
        <MoBtn
          text="확인"
          variant="outline"
          big
          width="w-full"
          onClick={onConfirm || (() => router.back())}
        />
      )}

      <MoBtn
        text={
          type === 'income'
            ? '입금 완료'
            : type === 'outcome'
              ? '지급 완료'
              : type === 'delivery'
                ? '납품 완료'
                : '다음 스캔하기'
        }
        variant="primary"
        big={true}
        width="w-full"
        onClick={onClick}
      />
    </div>
  );
};

export default MoBottomNavigation;
