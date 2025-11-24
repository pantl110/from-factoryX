import { useMemo } from 'react';

import { MaterialResponseModel } from '@/types/data-model';
import MoChip from '@/ui/mo-chip';
import { LabelInfo } from '../label-info';
import InfoDetail from '../info-detail';
import { getMaterialStockStatus } from '@/utils';
import {
  InventoryStatusType,
  InventoryStatusColorMap,
} from '@/types/status-type';

interface MaterialInfoProps {
  material: MaterialResponseModel | null;
  isLoading?: boolean;
}

const MaterialInfo = ({ material, isLoading }: MaterialInfoProps) => {
  const stockStatus = useMemo(() => {
    const status = getMaterialStockStatus({
      currentStock: material?.current_stock ?? null,
      maxStock: material?.max_stock ?? null,
      rop: material?.rop ?? null,
      standardStock: material?.standard_stock ?? null,
    });

    if (!status) return null;

    // InventoryStatusColorMap에서 color 값을 가져와서 MoChip variant로 변환
    const colorMap = InventoryStatusColorMap[status];
    const color = colorMap?.color;

    // color 값을 MoChip variant로 변환 ('red'만 'red-secondary'로 변환)
    const variant =
      color === 'red'
        ? 'red-secondary'
        : (color as
            | 'primary'
            | 'secondary'
            | 'red'
            | 'red-secondary'
            | 'orange'
            | 'purple') || 'outline';

    return {
      text: status,
      variant,
    };
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

  const rop = useMemo(() => {
    if (typeof material?.rop === 'number') {
      return `${material.rop.toLocaleString()}${material?.unit ?? ''}`;
    }
    return material?.rop ?? '-';
  }, [material]);

  const maxStock = useMemo(() => {
    if (typeof material?.max_stock === 'number') {
      return `${material.max_stock.toLocaleString()}${material?.unit ?? ''}`;
    }
    return material?.max_stock ?? '-';
  }, [material]);

  return (
    <div className="px-7 py-8 flex flex-col gap-8">
      <h3 className="m-Heading-3-semibold">자재 정보</h3>
      {isLoading ? (
        <></>
      ) : (
        <div className="flex flex-col gap-5">
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
              <InfoDetail label="안전 재고" value={standardStock} />
              <InfoDetail label="ROP" value={rop} />
              <InfoDetail label="적정 재고" value={maxStock} />
            </div>
          </div>
          <LabelInfo
            label="유통기한"
            value={material?.expiry_days ? `${material.expiry_days}일` : '-'}
          />
          <LabelInfo
            label="유통기한 상태"
            value={!material?.expiry_status ? '-' : undefined}
            chip={
              material?.expiry_status ? (
                <MoChip
                  text={material.expiry_status}
                  variant={
                    material.expiry_status === '위험'
                      ? 'red-secondary'
                      : 'secondary'
                  }
                />
              ) : undefined
            }
          />
        </div>
      )}
    </div>
  );
};

export default MaterialInfo;
