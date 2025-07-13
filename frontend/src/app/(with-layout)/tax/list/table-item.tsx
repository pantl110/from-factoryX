import Chip from '@/ui/chip'
import { TaxDocumentTypeColorMap } from '@/types/status-type'
import Checkbox from '@/ui/checkbox'
import { TaxDataModel } from '@/mocks/tax-data'

interface TableItemProps {
  onItemClick?: () => void
  item: TaxDataModel
  onToggle: () => void
  isChecked: boolean
}

const TableItem = ({ onItemClick, item, onToggle, isChecked }: TableItemProps) => {
  const { bgColor, textColor } = TaxDocumentTypeColorMap[item.taxType]
  return (
    <div
      className="flex items-center border-b border-lg h-14 w-full min-w-[1018px] text-bl Me_Body-1 hover:bg-bg transition-colors duration-200 cursor-pointer"
      onClick={onItemClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onItemClick?.()
      }}
    >
      <Checkbox isChecked={isChecked} onToggle={onToggle} />
      <div className="px-3 flex-1">
        <Chip text={item.taxType} bgColor={bgColor} textColor={textColor} />
      </div>
      <p className="w-[150px] px-3 text-dg">{item.date}</p>
      <p className="flex-2 px-3 text-dg">{item.company}</p>
      <p className="flex-2 px-3 text-dg">{item.productName}</p>
      <p className="flex-2 px-3 text-dg">{item.supplyAmount}</p>
      <p className="flex-2 px-3 text-dg">{item.taxAmount}</p>
      <p className="flex-2 px-3 text-dg">{item.totalAmount}</p>
    </div>
  )
}

export default TableItem
