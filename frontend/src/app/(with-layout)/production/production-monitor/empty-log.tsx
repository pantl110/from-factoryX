const EmptyLog = () => {
  return (
    <div className="flex flex-col justify-center items-center gap-1 w-full border border-[#E4E4E7] rounded">
      <h4 className="Heading-4 text-dg">아직 등록된 생산 로그가 없어요.</h4>
      <p className="Re_Body-1 text-gr">
        생산 설비를 바꾸거나 메모를 추가하면 로그가 자동으로 기록돼요.
      </p>
    </div>
  );
};

export default EmptyLog;
