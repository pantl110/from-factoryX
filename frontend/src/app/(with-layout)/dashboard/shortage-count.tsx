const ShortageCount = () => {
  return (
    <div className="pt-5 pb-4 px-5 rounded-lg border border-[#eeeeee] h-[141px]">
      <div className="flex flex-col gap-1">
        <p className="Heading-4 text-sv">부족한 품목 수</p>
        <div className="flex flex-col gap-1">
          <p className="Heading-1">
            3 <span>개</span>
          </p>
          <div className="flex justify-end">
            <button className="px-4 rounded-md Me_Body-1 border border-lg">
              확인하러 가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortageCount;
