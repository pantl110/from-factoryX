import { useMemo } from 'react';

import { MaterialResponseModel } from '@/types/data-model';
import MoChip from '@/ui/mo-chip';
import { LabelInfo } from '../label-info';
import InfoDetail from '../info-detail';

interface MaterialInfoProps {
  material: MaterialResponseModel | null;
  isLoading?: boolean;
}

const MaterialInfo = ({ material, isLoading }: MaterialInfoProps) => {
  const stockStatus = useMemo(() => {
    if (
      typeof material?.current_stock === 'number' &&
      typeof material?.standard_stock === 'number'
    ) {
      if (material.current_stock >= material.standard_stock) {
        return { text: '충분', variant: 'secondary' as const };
      }
      return { text: '부족', variant: 'red-secondary' as const };
    }
    return null;
  }, [material]);

  const currentStock = useMemo(() => {
    if (typeof material?.current_stock === 'number') {
      return `${material.current_stock.toLocaleString()}${material?.unit ?? ''}`;
    }
    return material?.current_stock ?? '-';
  }, [material]);

  const standardStock = useMemo(() => {
    if (typeof material?.standard_stock === 'number') {
      return `${material.standard_stock.toLocaleString()}${material?.unit ?? ''}`;
    }
    return material?.standard_stock ?? '-';
  }, [material]);

  return (
    <div className="px-7 py-8 flex flex-col gap-8">
      <h3 className="m-Heading-3-semibold">자재 정보</h3>
      {isLoading ? (
        <></>
      ) : (
        <div className="flex flex-col gap-5">
          <LabelInfo
            label="구분"
            chip={<MoChip text="원자재" variant="orange" />}
          />
          <LabelInfo label="자재명" value={material?.name ?? '-'} />
          <LabelInfo label="자재코드" value={material?.code ?? '-'} />
          <LabelInfo label="규격" value={material?.spec ?? '-'} />
          <LabelInfo label="단위" value={material?.unit ?? '-'} />
          <div className="flex flex-col gap-4">
            <LabelInfo
              label="재고 상태"
              value={!stockStatus ? '-' : undefined}
              chip={
                stockStatus ? (
                  <MoChip
                    text={stockStatus.text}
                    variant={stockStatus.variant}
                  />
                ) : undefined
              }
            />
            <div className="flex flex-col gap-3">
              <InfoDetail label="현재 재고" value={currentStock} />
              <InfoDetail label="기준 재고" value={standardStock} />
              <InfoDetail label="안전재고" value="" />
            </div>
          </div>
          {/* <LabelInfo label="유통기한" value="2025-10-03" />
        <LabelInfo
          label="유통기한 상태"
          chip={<MoChip text="부족" variant="red-secondary" />}
        /> */}
        </div>
      )}
    </div>
  );
};

export default MaterialInfo;
