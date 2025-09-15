import { BellSimple, User, CaretRight } from "@phosphor-icons/react/dist/ssr";

const TopBar = () => {
  return (
    <header className="flex items-center justify-between w-full h-[60px] px-10">
      <div className="flex items-center gap-1">
        <p className="Re_Body-1 text-dg">수주관리</p>
        <CaretRight size={16} className="text-[#8c8c8c]" />
        <p className="Re_Body-1 text-dg">진행 중인 작업 내역</p>
      </div>

      <div className="flex">
        <div className="flex items-center justify-center w-11 h-11">
          <BellSimple size={20} className="text-dg" />
        </div>
        <div className="flex items-center justify-center w-11 h-11">
          <div className="flex items-center justify-center bg-blue-200 rounded-full w-8 h-8 border-2 border-blue-600">
            <User size={20} className="text-blue-600" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
