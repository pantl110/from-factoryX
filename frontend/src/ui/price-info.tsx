interface PriceInfoProps {
  textColor?: string;
}

const PriceInfo = ({ textColor = "text-primary" }: PriceInfoProps) => {
  return (
    <div className="flex flex-col gap-4 bg-lg-table px-4 py-4 rounded-lg">
      <div className="flex w-full justify-between items-center">
        <span className="w-[150px] Me_Body-1 text-sv">공급가액</span>
        <span className={`${textColor} Me_Body-3`}>
          5,525,000<span className="text-sv Me_Body-2">원</span>
        </span>
      </div>
      <div className="flex w-full justify-between items-center">
        <span className="w-[150px] Me_Body-1 text-sv">세액(VAT 10%)</span>
        <span className={`${textColor} Me_Body-3`}>
          552,500<span className="text-sv Me_Body-2">원</span>
        </span>
      </div>
      <div className="flex w-full justify-between items-center">
        <span className="w-[150px] Me_Body-1 text-sv">총액</span>
        <span className={`${textColor} Me_Body-3`}>
          6,077,500<span className="text-sv Me_Body-2">원</span>
        </span>
      </div>
    </div>
  );
};

export default PriceInfo;
