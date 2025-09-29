import Checkbox from '@/ui/checkbox';
import useMemberStore from '@/store/member-store';

interface ClientTableHeaderProps {
  isAllChecked?: boolean;
  onToggleAll?: () => void;
}

const ClientTableHeader = ({
  isAllChecked,
  onToggleAll,
}: ClientTableHeaderProps) => {
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';

  return (
    <div className="flex h-12 min-w-[1697px] items-center border-t border-b border-[#eeeeee] Me_Body-1 text-sv">
      {!isViewer && (
        <Checkbox
          isChecked={isAllChecked || false}
          onToggle={onToggleAll || (() => {})}
        />
      )}
      <div className="flex-[1.2] px-3 flex gap-1 items-center">
        <p className=" text-sv">거래처</p>
        {/* <CaretDown size={16} className="text-sv" /> */}
      </div>
      <p className="px-3 flex-2">회사명</p>
      <p className="px-3 flex-[1.5]">사업자등록번호</p>
      <p className="px-3 flex-1">대표자명</p>
      <p className="px-3 flex-[1.5]">업태</p>
      <p className="px-3 flex-[1.5]">종목</p>
      <p className="px-3 flex-[1.5]">연락처</p>
      <p className="px-3 flex-[2]">이메일</p>
    </div>
  );
};

export default ClientTableHeader;
