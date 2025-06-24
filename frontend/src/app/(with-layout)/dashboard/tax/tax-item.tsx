import { TaxDocumentType, TaxDocumentTypeColorMap } from "@/types/status-type";
import Chip from "@/ui/chip";

interface TaxItemProps {
  taxType: TaxDocumentType;
  company: string;
  date: string;
}

const TaxItem = ({ taxType, company, date }: TaxItemProps) => {
  const color = TaxDocumentTypeColorMap[taxType];

  return (
    <div className="flex items-center justify-between border border-[#eeeeee] rounded-sm py-3 px-5">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center">
          <Chip
            text={taxType}
            textColor={color.textColor}
            bgColor={color.bgColor}
          />
        </div>
        <p className="Me_Body-2 text-dg">{company} 세금계산서 발행 </p>
      </div>
      <p className="Me_Body-2 text-sv">{date}</p>
    </div>
  );
};

export default TaxItem;
