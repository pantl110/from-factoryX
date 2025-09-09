interface PriceInfoSectionProps {
  supplyAmount: number;
  taxAmount: number;
}

const PriceInfoSection = ({
  supplyAmount,
  taxAmount,
}: PriceInfoSectionProps) => {
  return (
    <div className="flex flex-col gap-4">
      <h4 className="Heading-4">거래 금액</h4>

      <div className="flex gap-2.5 h-25">
        {/* 현금 영수증의 정보 */}
        <div className="flex-1 flex gap-2 border border-lg rounded-[8px] px-2 py-4.5">
          <div className="flex-1 px-3 py-2 flex flex-col items-center justify-center">
            <p className="Re_Body-2 text-sv">공급가액</p>
            <p className="Me_Body-3 ">{supplyAmount.toLocaleString()}</p>
          </div>
          <div className="flex-1 px-3 py-2 flex flex-col items-center justify-center border-x border-lg">
            <p className="Re_Body-2 text-sv">세액(VAT 10%)</p>
            <p className="Me_Body-3">{taxAmount.toLocaleString()}</p>
          </div>
          <div className="flex-1 px-3 py-2 flex flex-col items-center justify-center">
            <p className="Re_Body-2 text-sv">합계 금액</p>
            <p className="Me_Body-3">
              {(supplyAmount + taxAmount).toLocaleString()}
            </p>
          </div>
        </div>
        {/* 선택한 정보 */}
        <div className="flex-[0.5] flex flex-col gap-2 p-4 bg-bg rounded-[8px]">
          <div className="flex justify-between items-center h-7.5">
            <p className="Me_Body-1 text-dg">선택 금액</p>
            <p className="Me_Body-2 text-bl">0원</p>
          </div>
          <div className="flex justify-between items-center h-7.5">
            <p className="Me_Body-1 text-dg">차액</p>
            <p className="Me_Body-2 text-primary">110,000원</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceInfoSection;
