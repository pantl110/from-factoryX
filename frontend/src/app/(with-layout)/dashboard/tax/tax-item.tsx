import { TaxDocumentType, TaxDocumentTypeColorMap } from '@/types/status-type'
import Chip from '@/ui/chip'

interface TaxItemProps {
  taxType: TaxDocumentType
  company: string
  date: string
  onClick?: () => void
}

const TaxItem = ({ taxType, company, date, onClick }: TaxItemProps) => {
  const color = TaxDocumentTypeColorMap[taxType]

  return (
    <div
      className="flex items-center justify-between border border-[#eeeeee] rounded-sm py-3 px-5 w-full h-14 cursor-pointer hover:bg-bg transition-colors ease-in-out duration-200"
      onClick={onClick}
    >
      <div className="flex items-center gap-4 w-full">
        <div className="flex items-center justify-center flex-shrink-0">
          <Chip text={taxType} textColor={color.textColor} bgColor={color.bgColor} />
        </div>
        <p
          className="Me_Body-2 text-dg truncate flex-1 min-w-0"
          title={`${company} 세금계산서 ${taxType === '매출' ? '발행' : '수신'}`}
        >
          {company} 세금계산서 {taxType === '매출' ? '발행' : '수신'}
        </p>
        <p className="pl-4 Me_Body-2 text-gr flex-shrink-0 w-fit text-right">{date}</p>
      </div>
    </div>
  )
}

export default TaxItem
