import Checkbox from '@/ui/checkbox'
import { ProductResponseModel } from '@/types/data-model'

interface TableItemProps {
  product: ProductResponseModel
  onClick: () => void
  checked: boolean
  onToggle: () => void
}

const TableItem = ({ product, onClick, checked, onToggle }: TableItemProps) => {
  return (
    <div
      className="flex items-center h-14 border-b border-[#eeeeee] Me_Body-1 cursor-pointer hover:bg-bg transition-colors duration-200"
      onClick={onClick}
    >
      <Checkbox isChecked={checked} onToggle={onToggle} />
      <p className="flex-1 px-3 text-dg">{product.name}</p>
      <p className="flex-1 px-3 text-dg">{product.code}</p>
      <p className="flex-1 px-3 text-dg">{product.spec}</p>
      <p className="w-[80px] px-3 text-dg">{product.unit}</p>
      <p className="flex-1 px-3 text-dg">
        {product.current_stock === undefined || product.current_stock === null
          ? '-'
          : product.current_stock.toLocaleString()}
      </p>
    </div>
  )
}

export default TableItem
