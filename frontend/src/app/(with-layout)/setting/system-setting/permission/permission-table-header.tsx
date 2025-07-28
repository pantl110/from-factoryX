import Checkbox from '@/ui/checkbox';

interface PermissionTableHeaderProps {
  isAllChecked: boolean;
  onToggleAll: () => void;
}

const PermissionTableHeader = ({
  isAllChecked,
  onToggleAll,
}: PermissionTableHeaderProps) => {
  return (
    <div className="flex items-center justify-between w-full h-12 text-sv Me_Body-1 border-t border-b border-lg">
      <Checkbox isChecked={isAllChecked} onToggle={onToggleAll} />
      <p className="px-3 flex-1">초대 상태</p>
      <p className="px-3 flex-1">이름</p>
      <p className="px-3 flex-2">이메일</p>
      <p className="px-3 flex-1">권한</p>
      <p className="px-3 flex-1">초대 날짜</p>
    </div>
  );
};

export default PermissionTableHeader;
