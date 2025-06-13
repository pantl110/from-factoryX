import Chip from "@/ui/chip";

interface TaxItemProps {
  type: "매출" | "매입";
  text: string;
  date: string;
}

const TaxItem = ({ type, text, date }: TaxItemProps) => {
  const chipColor = type === "매출" ? "text-primary" : "text-red";
  const chipBg = type === "매출" ? "bg-primary-8" : "bg-red-8";
  return (
    <div className="flex items-center justify-between border border-[#eeeeee] rounded-sm py-3 px-5">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center">
          <Chip text={type} textColor={chipColor} bgColor={chipBg} />
        </div>
        <p className="Me_Body-2 text-dg">{text}</p>
      </div>
      <p className="Me_Body-2 text-sv">{date}</p>
    </div>
  );
};

export default TaxItem;
