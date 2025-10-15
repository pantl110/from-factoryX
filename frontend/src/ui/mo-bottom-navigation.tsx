import MoBtn from './mo-btn';

interface MoBottomNavigationProps {
  type: 'income' | 'outcome';
}

const MoBottomNavigation = ({ type }: MoBottomNavigationProps) => {
  return (
    <div className="fixed bottom-0 z-30 w-full bg-wh px-3 pt-5 pb-6 border-t border-bg">
      <MoBtn
        text={type === 'income' ? '입금 완료' : '지급 완료'}
        variant="primary"
        big={true}
        width="w-full"
        onClick={() => {}}
      />
    </div>
  );
};

export default MoBottomNavigation;
