import { ProjectPlanModel } from '@/types/data-model';
import Chip from '@/ui/chip';
import { useState } from 'react';
import ProductDetail from '../../stock/product/product-detail';
import { useMaterialStatus } from '@/hooks';
import { ArrowLineUpRight } from '@phosphor-icons/react';

interface ProductionLogTableItemProps {
  plan: ProjectPlanModel;
}
const ProductionLogTableItem = ({ plan }: ProductionLogTableItemProps) => {
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const { materialStatus, isLoading: isMaterialStatusLoading } =
    useMaterialStatus(plan.quotation_product.product.id);
  return (
    <>
      <div className="flex items-center h-14 min-w-[1559px] border-b border-[#eeeeee] Me_Body-1 text-dg">
        <p className="flex-2 px-3">{plan.quotation_product.product.name}</p>
        <p className="flex-1 px-3">{plan.quotation_product.product.code}</p>
        <p className="flex-1 px-3">{plan.quotation_product.product.spec}</p>
        <p className="w-[80px] px-3">{plan.quotation_product.product.unit}</p>
        <p className="flex-1 px-3">
          {plan.quotation_product.quantity?.toLocaleString() || '-'}
        </p>
        <p className="flex-1 px-3">{plan.quantity?.toLocaleString() || '-'}</p>
        <p className="flex-1 px-3">{plan.equipment.name || '-'}</p>
        <p className="w-[200px] px-3">{plan.start_date || '-'}</p>
        <p className="w-[140px] px-3">
          {plan.avg_production_time ? `${plan.avg_production_time}초` : '-'}
        </p>
        <div className="w-[150px] px-3">
          {!isMaterialStatusLoading && materialStatus && (
            <div className="flex justify-between">
              <Chip
                text={materialStatus}
                textColor={
                  materialStatus === '충분' ? 'text-primary' : 'text-red'
                }
                bgColor={
                  materialStatus === '충분' ? 'bg-primary-8' : 'bg-red-8'
                }
              />
              {materialStatus === '부족' && (
                <div
                  className="cursor-pointer hover:bg-bg rounded-[8px] w-9 h-9 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out"
                  onClick={() => setIsProductDetailOpen(true)}
                >
                  <ArrowLineUpRight size={16} className="text-dg" />
                </div>
              )}
            </div>
          )}
        </div>
        <p className="w-[200px] px-3">{plan.end_date || '-'}</p>

        {/* 품목 디테일 판넬 보기 */}
        {isProductDetailOpen && (
          <ProductDetail
            productId={plan.quotation_product.product.id}
            onClose={() => setIsProductDetailOpen(false)}
          />
        )}
      </div>
    </>
  );
};

export default ProductionLogTableItem;
