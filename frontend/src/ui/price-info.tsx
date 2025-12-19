interface PriceInfoProps {
  supplyAmount: number;
  taxAmount: number;
  textColor: string;
}

const PriceInfo = ({
  supplyAmount,
  taxAmount,
  textColor = 'text-primary',
}: PriceInfoProps) => {
  return (
    <div className="flex flex-col gap-4 bg-lg-table px-4 py-4 rounded-lg w-full">
      <div className="flex w-full justify-between items-center">
        <span className="w-[150px] Me_Body-1 text-sv">공급가액</span>
        <span className={`${textColor} Me_Body-3`}>
          {supplyAmount?.toLocaleString()}
          <span className="text-sv Me_Body-2">원</span>
        </span>
      </div>
      <div className="flex w-full justify-between items-center">
        <span className="w-[150px] Me_Body-1 text-sv">세액(VAT 10%)</span>
        <span className={`${textColor} Me_Body-3`}>
          {taxAmount?.toLocaleString()}
          <span className="text-sv Me_Body-2">원</span>
        </span>
      </div>
      <div className="flex w-full justify-between items-center">
        <span className="w-[150px] Me_Body-1 text-sv">합계금액</span>
        <span className={`${textColor} Me_Body-3`}>
          {(supplyAmount + taxAmount)?.toLocaleString()}
          <span className="text-sv Me_Body-2">원</span>
        </span>
      </div>
    </div>
  );
};

export default PriceInfo;
