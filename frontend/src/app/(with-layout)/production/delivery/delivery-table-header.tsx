import Checkbox from '@/ui/checkbox';

interface DeliveryTableHeaderProps {
  isAllChecked: boolean;
  onToggleAll: () => void;
}

const DeliveryTableHeader = ({
  isAllChecked,
  onToggleAll,
}: DeliveryTableHeaderProps) => {
  return (
    <div className="flex items-center h-12 min-w-[1305px] Me_Body-1 rounded bg-lg-table cursor-default">
      <Checkbox isChecked={isAllChecked} onToggle={onToggleAll} />
      <p className="w-[150px] py-1 px-3 text-sv">납품 상태</p>
      <p className="flex-2 py-1 px-3 text-sv">품목명</p>
      <p className="flex-1 py-1 px-3 text-sv">품목 코드</p>
      <p className="flex-1 py-1 px-3 text-sv">규격</p>
      <p className="w-[80px] py-1 px-3 text-sv">단위</p>
      <p className="flex-1 py-1 px-3 text-sv">납품 수량</p>
      <p className="flex-1 py-1 px-3 text-sv">납품일자</p>
    </div>
  );
};

export default DeliveryTableHeader;
