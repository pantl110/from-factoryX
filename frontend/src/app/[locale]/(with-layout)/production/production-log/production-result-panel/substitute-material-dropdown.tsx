'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Dropdown, DropdownItem } from '@/ui';
import { RoundChip } from '@/ui/round-chip';
import { useSubstitutesByMaterialQuery } from '@/hooks';
import { MaterialSimpleModel } from '@/types/data-model';

interface SubstituteMaterialDropdownProps {
  materialId: number;
  materialName: string;
  width?: string;
  onClose: () => void;
  onSelect?: (item: { id: number; name: string }) => void;
}

export const SubstituteMaterialDropdown = ({
  materialId,
  materialName,
  width,
  onClose,
  onSelect,
}: SubstituteMaterialDropdownProps) => {
  const t = useTranslations('production.substituteMaterial');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<MaterialSimpleModel[]>([]);

  const { data, isLoading } = useSubstitutesByMaterialQuery(
    materialId,
    true,
    page,
    4
  );

  useEffect(() => {
    if (!data) return;

    // 첫 페이지는 새로 세팅, 이후 페이지는 뒤에 붙이기
    if (page === 1) {
      setItems(data.data ?? []);
    } else {
      setItems((prev) => [...prev, ...(data.data ?? [])]);
    }
  }, [data, page]);

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
      {/* 기준 자재 */}
      <DropdownItem
        text={materialName}
        onClick={() => {
          onSelect?.({ id: materialId, name: materialName });
          onClose();
        }}
      />

      {/* 대체 자재들 - chip과 함께 표시 */}
      {items.map((item) => (
        <DropdownItem
          key={item.id}
          onClick={() => {
            onSelect?.({ id: item.id, name: item.name });
            onClose();
          }}
        >
          <div className="pl-2 pr-4 flex items-center gap-2">
            <RoundChip text={t('label')} variant="sm" color="secondary" />
            <p className="Heading-4 text-dg">{item.name}</p>
          </div>
        </DropdownItem>
      ))}

      {/* 로딩 인디케이터 */}
      {isLoading && <DropdownItem text="..." noHover />}
    </Dropdown>
  );
};
