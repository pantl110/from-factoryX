const NoSelectedLog = () => {
  return (
    <div className="h-[calc(100%-40px)] mb-10 border border-lg rounded flex items-center justify-center flex-col gap-1">
      <h4 className="Heading-4 text-dg">아직 선택된 로그가 없어요.</h4>
      <p className="Re_Body-1 text-gr">로그를 클릭하면 자세한 내용을 확인할 수 있어요.</p>
    </div>
  )
}

export default NoSelectedLog
