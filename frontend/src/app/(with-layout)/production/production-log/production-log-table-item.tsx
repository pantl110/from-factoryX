import { ProductionDataModel } from '@/mocks/production-data'
import Chip from '@/ui/chip'
import { useState } from 'react'
import ProductDetail from '../../stock/product/product-detail'
import { productData } from '@/mocks/product-data'

interface ProductionLogTableItemProps {
  product: ProductionDataModel
}
const ProductionLogTableItem = ({ product }: ProductionLogTableItemProps) => {
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false)
  return (
    <>
      <div className="flex items-center h-14 min-w-[1559px] border-b border-[#eeeeee] Me_Body-1 text-dg">
        <p className="flex-2 px-3">{product.productName}</p>
        <p className="flex-1 px-3">{product.productCode}</p>
        <p className="flex-1 px-3">{product.standard}</p>
        <p className="w-[80px] px-3">{product.unit}</p>
        <p className="flex-1 px-3">{product.orderQuantity?.toLocaleString() || '-'}</p>
        <p className="flex-1 px-3">{product.productionQuantity?.toLocaleString() || '-'}</p>
        <p className="flex-1 px-3">{product.machine || '-'}</p>
        <p className="w-[200px] px-3">{product.productionTime || '-'}</p>
        <p className="w-[140px] px-3">{product.unitTime || '-'}</p>
        <div className="w-[150px] px-3">
          {product.materialStatus && (
            <div className="flex justify-between">
              <Chip
                text={product.materialStatus}
                textColor={product.materialStatus === '충분' ? 'text-primary' : 'text-red'}
                bgColor={product.materialStatus === '충분' ? 'bg-primary-8' : 'bg-red-8'}
              />
              {product.materialStatus === '부족' && (
                <p
                  className="cursor-pointer Re_Body-1 text-gr flex items-center opacity-0 hover:opacity-100 transition-opacity duration-200 ease-in-out"
                  onClick={() => setIsProductDetailOpen(true)}
                >
                  상세보기
                </p>
              )}
            </div>
          )}
        </div>
        <p className="w-[200px] px-3">{product.endDate || '-'}</p>
        {isProductDetailOpen && (
          <ProductDetail
            product={productData[0]}
            onClose={() => setIsProductDetailOpen(false)}
            mode="view"
          />
        )}
      </div>
    </>
  )
}

export default ProductionLogTableItem
