'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Dropdown, DropdownItem } from '@/ui';
import { useGetMaterialAvailableLots } from '@/hooks';
import { MaterialAvailableLotResponseModel } from '@/types/data-model';

interface LotDropdownProps {
  width?: string;
  materialId: number;
  onClose: () => void;
  onSelect: (item: {
    id: number;
    name: string;
    source: 'history' | 'repackaging';
  }) => void;
}

export const LotDropdown = ({
  width,
  materialId,
  onClose,
  onSelect,
}: LotDropdownProps) => {
  const t = useTranslations('production.lotDropdown');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<MaterialAvailableLotResponseModel[]>([]);

  const { data, isLoading } = useGetMaterialAvailableLots(materialId, page, 5);

  useEffect(() => {
    // materialId가 바뀌면 첫 페이지부터 다시 로딩
    setPage(1);
    setItems([]);
  }, [materialId]);

  useEffect(() => {
    if (!data) return;

    if (page === 1) {
      setItems(data.data ?? []);
    } else {
      setItems((prev) => [...prev, ...(data.data ?? [])]);
    }
  }, [data, page]);

  const lots = items;
  const hasMore = !!data?.nextPage;

  return (
    <Dropdown
      onClose={onClose}
      width={width}
      maxHeight="max-h-[220px]"
      hasMore={hasMore}
      isLoading={isLoading}
      onLoadMore={() => {
        if (!isLoading && hasMore) {
          setPage((prev) => prev + 1);
        }
      }}
    >
      {isLoading && lots.length === 0 && <DropdownItem text="..." noHover />}
      {!isLoading && lots.length === 0 && (
        <DropdownItem text={t('noAvailableLots')} noHover />
      )}
      {!isLoading &&
        lots.map((lot) => (
          <DropdownItem
            key={`${lot.source}-${lot.id}`}
            text={lot.lot_number}
            onClick={() =>
              onSelect({
                id: lot.id,
                name: lot.lot_number,
                source: lot.source,
              })
            }
          />
        ))}
    </Dropdown>
  );
};
