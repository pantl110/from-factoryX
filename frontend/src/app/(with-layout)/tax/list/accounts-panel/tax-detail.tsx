import { IconBtn, MiniBtn } from '@/ui';
import { FileText } from '@phosphor-icons/react';

const TaxDetail = () => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 flex items-center">매출 세금계산서</h3>
      {/* 표 */}
      <div className="flex items-center gap-3 py-3 px-5 rounded-[8px] border border-lg">
        {/* 아이콘 */}
        <div className="flex items-center justify-center w-10 h-10 p-1 rounded-[4px] border border-lg">
          <FileText size={32} className="text-primary" />
        </div>

        {/* 정보 */}
        <div className="flex-1">
          <p className="Me_Body-2 text-dg">전자세금계산서</p>
          <p className="Re_Body-1 text-gr">승인번호 20241124-41000235-1132</p>
        </div>

        {/* 버튼 */}
        <MiniBtn text="상세보기" variant="whiteOutline" />
      </div>
    </div>
  );
};

export default TaxDetail;
