import { useMemo, type ComponentProps } from 'react';

import { MaterialResponseModel } from '@/types/data-model';
import MoChip from '@/ui/mo-chip';
import { LabelInfo } from '../label-info';
import InfoDetail from '../info-detail';
import { getMaterialStockStatus } from '@/utils';
import { InventoryStatusColorMap } from '@/types/status-type';
import { mapExpiryStatus } from '@/app/[locale]/(with-layout)/stock/material/material-detail/utils';
import { useTranslations } from 'next-intl';

interface MaterialInfoProps {
  material: MaterialResponseModel | null;
  isLoading?: boolean;
}

type MoChipVariantType = ComponentProps<typeof MoChip>['variant'];

const MaterialInfo = ({ material, isLoading }: MaterialInfoProps) => {
  const t = useTranslations('common');
  const tStock = useTranslations('stock.materialDetail');
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

  const expiryStatus = useMemo(
    () => mapExpiryStatus(material?.expiry_status),
    [material?.expiry_status]
  );

  const expiryChip = useMemo(() => {
    if (!expiryStatus) {
      return null;
    }
    const variant: MoChipVariantType =
      expiryStatus === 'warning' ? 'red-secondary' : 'secondary';
    const text =
      material?.expiry_status ??
      (expiryStatus === 'warning'
        ? tStock('expiryStatus.risk')
        : tStock('expiryStatus.safe'));
    return { text, variant };
  }, [expiryStatus, material?.expiry_status, tStock]);

  return (
    <div className="px-7 py-8 flex flex-col gap-8">
      <h3 className="m-Heading-3-semibold">
        {tStock('detail.materialInfoTitle')}
      </h3>
      {isLoading ? (
        <></>
      ) : (
        <div className="flex flex-col gap-5">
          <LabelInfo label={t('materialName')} value={material?.name ?? '-'} />
          <LabelInfo label={t('materialCode')} value={material?.code ?? '-'} />
          <LabelInfo label={t('specification')} value={material?.spec ?? '-'} />
          <LabelInfo label={t('unit')} value={material?.unit ?? '-'} />
          <div className="flex flex-col gap-4">
            <LabelInfo
              label={tStock('detail.info.labels.stockStatus')}
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
              <InfoDetail label={t('currentStock')} value={currentStock} />
              <InfoDetail
                label={tStock('detail.info.labels.standardStock')}
                value={standardStock}
              />
              <InfoDetail
                label={tStock('detail.info.labels.rop')}
                value={rop}
              />
              <InfoDetail
                label={tStock('detail.info.labels.maxStock')}
                value={maxStock}
              />
            </div>
          </div>
          <LabelInfo
            label={t('expirationDate')}
            value={
              material?.expiry_days
                ? `${material.expiry_days}${t('days')}`
                : '-'
            }
          />
          <LabelInfo
            label={tStock('expirationDateStatus')}
            value={!expiryChip ? '-' : undefined}
            chip={
              expiryChip ? (
                <MoChip text={expiryChip.text} variant={expiryChip.variant} />
              ) : undefined
            }
          />
        </div>
      )}
    </div>
  );
};

export default MaterialInfo;
