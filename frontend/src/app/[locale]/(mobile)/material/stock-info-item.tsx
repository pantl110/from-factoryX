import Image from 'next/image';

import { LocationModel } from '@/types/data-model';
import MoChip from '@/ui/mo-chip';
import { formatDate } from '@/utils';
import { useTranslations } from 'next-intl';

interface StockInfoItemProps {
  location: LocationModel;
}

const StockInfoItem = ({ location }: StockInfoItemProps) => {
  const t = useTranslations('common');
  const images = Array.isArray(location.images) ? location.images : [];

  return (
    <div className="flex flex-col gap-5 border-b border-bg py-8">
      {/* 사진 */}
      {images.length > 0 && (
        <div className="px-7 flex gap-2.5 overflow-x-auto scrollbar-hide">
          {images.map((src, idx) => (
            <div
              key={idx}
              className="w-20 h-20 rounded-[8px] bg-bg shrink-0 overflow-hidden relative"
            >
              <Image
                src={src}
                alt={t('warehouseImage')}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* 정보 */}
      <div className="px-7 flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <MoChip
            text={location.role || '-'}
            variant={
              location.role === 'admin'
                ? 'purple'
                : location.role === 'manager'
                  ? 'secondary'
                  : 'orange'
            }
            small={true}
          />
          <span className="Heading-5 text-sv">
            {(location.email && location.email.split('@')[0]) || '-'}
          </span>
        </div>
        <p className="m-Body-2 text-bl">{location.location || '-'}</p>
        <p className="m-Body-3 text-sv">{location.memo || '-'}</p>
        <p className="m-Body-4 text-gr">
          {location.updated_at || location.created_at
            ? formatDate((location.updated_at || location.created_at) as string)
            : '-'}
        </p>
      </div>
    </div>
  );
};

export default StockInfoItem;
