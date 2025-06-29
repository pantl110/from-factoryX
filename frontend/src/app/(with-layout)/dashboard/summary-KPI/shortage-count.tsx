import MiniBtn from "@/ui/mini-btn";

const ShortageCount = () => {
  return (
    <div className="pt-5 pb-4 px-5 rounded-lg border border-[#eeeeee] h-[141px] shadow-[2px_2px_22px_rgba(0,0,0,0.1)] group">
      <div className="flex flex-col gap-1">
        <p className="Heading-4 text-sv">부족한 품목 수</p>
        <div className="flex flex-col gap-1">
          <p className="Heading-1">
            3 <span>개</span>
          </p>
          <div className="flex justify-end">
            <button className="px-4 rounded-md Me_Body-1 text-dg border border-lg opacity-0 hover:bg-bg group-hover:opacity-100 transition-opacity duration-200">
              확인하러 가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortageCount;
