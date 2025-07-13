const HistoryTableHeader = () => {
  return (
    <div className="flex items-center w-full h-12 border-t border-b border-[#eeeeee] Me_Body-1 text-sv">
      <p className="flex-1 py-1 px-3">품목명</p>
      <p className="flex-1 py-1 px-3">품목 코드</p>
      <p className="flex-1 py-1 px-3">규격</p>
      <p className="w-[80px] py-1 px-3">단위</p>
      <p className="flex-1 py-1 px-3">사용 수량</p>
      <p className="flex-1 py-1 px-3">잔여 수량</p>
    </div>
  )
}

export default HistoryTableHeader
