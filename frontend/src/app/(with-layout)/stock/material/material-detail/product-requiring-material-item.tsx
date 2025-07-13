interface ProductRequiringMaterialItemProps {
  productName: string
  productCode: string
  size: string
  unit: string
}

const ProductRequiringMaterialItem = ({
  productName,
  productCode,
  size,
  unit,
}: ProductRequiringMaterialItemProps) => {
  return (
    <div className="flex items-center h-14 border-b border-[#eeeeee] Me_Body-1">
      <p className="flex-1 px-3 text-dg">{productName}</p>
      <p className="flex-1 px-3 text-dg">{productCode}</p>
      <p className="flex-1 px-3 text-dg">{size}</p>
      <p className="w-[80px] px-3 text-dg">{unit}</p>
    </div>
  )
}

export default ProductRequiringMaterialItem
