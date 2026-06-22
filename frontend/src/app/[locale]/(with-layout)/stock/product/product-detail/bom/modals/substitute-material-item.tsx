'use client';

import IconBtn from '@/ui/icon-btn';
import { ArrowLineUpRight } from '@phosphor-icons/react';
import { MaterialSimpleModel } from '@/types/data-model';
import { useState } from 'react';
import MaterialDetailPanel from '@/app/[locale]/(with-layout)/stock/material/material-detail';

interface SubstituteMaterialItemProps {
  material: MaterialSimpleModel;
  onSelectMaterial?: (materialId: number) => void;
  onUpdated?: () => void | Promise<unknown>;
}

const SubstituteMaterialItem = ({
  material,
  onSelectMaterial,
  onUpdated,
}: SubstituteMaterialItemProps) => {
  const [isMaterialDetailOpen, setIsMaterialDetailOpen] = useState(false);

  const handleOpenDetail = () => {
    setIsMaterialDetailOpen(true);
    onSelectMaterial?.(material.id);
  };

  return (
    <>
      <div className="flex items-center h-14 border-b border-lg Me_Body-3">
        <div
          className="flex-[1.4] px-3 flex items-center justify-between gap-1 min-w-0 truncate cursor-default"
          title={material.name}
        >
          <p className="text-dg truncate">{material.name}</p>
          <IconBtn
            icon={ArrowLineUpRight}
            iconSize={16}
            onClick={handleOpenDetail}
          />
        </div>
        <p className="flex-1 px-3 text-dg truncate cursor-default">
          {material.code}
        </p>
        <p className="flex-1 px-3 text-dg truncate cursor-default">
          {material.spec}
        </p>
        <p className="flex-1 px-3 text-dg truncate cursor-default">
          {material.unit}
        </p>
      </div>

      {isMaterialDetailOpen && (
        <MaterialDetailPanel
          setIsMaterialDetailOpen={setIsMaterialDetailOpen}
          selectedMaterialId={material.id}
          onSuccess={async () => {
            await onUpdated?.();
            setIsMaterialDetailOpen(false);
          }}
        />
      )}
    </>
  );
};

export default SubstituteMaterialItem;
