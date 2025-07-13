import { ProductDataModel } from '@/types/data-model'
import { X } from '@phosphor-icons/react'

interface ProductItemProps extends ProductDataModel {
  onClick?: () => void
  transaction?: boolean
}

const ProductItem = ({
  productName,
  productCode,
  size,
  unit,
  quantity,
  unitPrice,
  totalPrice,
  onClick,
  transaction = false,
}: ProductItemProps) => {
  return (
    <tr className="h-14 flex items-center Me_Body-1 text-dg border-b border-lg" onClick={onClick}>
      <td className="flex-1 px-3 truncate" title={productName}>
        {productName}
      </td>
      <td className="flex-1 px-3">{productCode}</td>
      <td className="flex-1 px-3">{size}</td>
      <td className="w-[80px] px-3">{unit}</td>
      <td className="flex-1 px-3">{quantity?.toLocaleString()}</td>
      <td className="w-[100px] px-3">{unitPrice?.toLocaleString()}</td>
      <td className="flex-1 px-3">{totalPrice?.toLocaleString()}</td>
      {!transaction && (
        <td className="w-8 h-full flex justify-center items-center cursor-pointer">
          <X size={16} className="text-sv" />
        </td>
      )}
    </tr>
  )
}

export default ProductItem
