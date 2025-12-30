const Memo = () => {
  return (
    <textarea
      rows={8}
      placeholder={`• 설비 점검 중 발견한 특이사항을 기록할 때
• 납품 일정이나 자재 입고 관련 메모가 필요할 때
• 갑자기 중요하게 기록할 일이 생길 때`}
      className="text-m-Body-4"
    />
  );
};

export default Memo;
