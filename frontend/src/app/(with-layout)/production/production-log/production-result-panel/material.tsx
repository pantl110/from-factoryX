import { MiniBtn } from '@/ui';
import { MaterialUsage } from './material-usage';
import { Result } from './result';
import { useState } from 'react';
import { MaterialProductConnectionModel } from '@/types/data-model';

interface MaterialProps {
  material: MaterialProductConnectionModel;
  productionQuantity: number;
}

export const Material = ({ material, productionQuantity }: MaterialProps) => {
  const [usages, setUsages] = useState<number[]>([0]);

  const handleAddUsage = () => {
    setUsages((prev) => [...prev, prev.length ? prev[prev.length - 1] + 1 : 0]);
  };

  const handleClearUsages = () => {
    setUsages((prev) => (prev.length ? [prev[0]] : [0]));
  };

  const handleDeleteUsage = (id: number) => {
    setUsages((prev) => {
      if (prev.length <= 1) {
        return prev;
      }
      return prev.filter((usageId) => usageId !== id);
    });
  };

  return (
    <div className="flex flex-col gap-5 py-5">
      <div className="flex items-center justify-between">
        <h4 className="Heading-4">
          {material.material_name
            ? `${material.material_name}${material.material_code ? ` (${material.material_code})` : ''}`
            : '-'}
        </h4>
        <div className="flex gap-0">
          <MiniBtn
            text="추가"
            height="h-8"
            textColor="text-sv"
            hoverColor="hover:text-primary"
            borderColor="border-lg"
            onClick={handleAddUsage}
          />
          <MiniBtn
            text="전체 삭제"
            variant="ghost"
            height="h-8"
            onClick={handleClearUsages}
          />
        </div>
      </div>

      <div className="flex flex-col">
        {/* 자재 사용 정보 입력 */}
        <div className="flex flex-col gap-5">
          {usages.map((id, index) => (
            <MaterialUsage
              key={id}
              materialName={material.material_name}
              materialId={material.material_id}
              unit={material.material_unit}
              onDelete={() => handleDeleteUsage(id)}
              canDelete={index !== 0}
            />
          ))}
        </div>

        {/* 로스율 계산 */}
        <Result
          unit={material.material_unit}
          expectedUsage={(material.quantity ?? 0) * productionQuantity}
        />
      </div>
    </div>
  );
};
