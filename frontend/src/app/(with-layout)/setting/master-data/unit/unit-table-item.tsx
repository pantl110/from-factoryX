import Chip from '@/ui/chip';
import { Trash } from '@phosphor-icons/react';
import { UnitConversionModel } from '@/types/data-model';

export const UnitTableItem = ({ unit }: { unit: UnitConversionModel }) => {
  return (
    <div className="flex h-14 items-center px-3 w-full border-b border-lg Me_Body-1 text-dg hover:bg-bg transition-colors duration-200 cursor-pointer">
      <div className="flex-1 px-3">
        <Chip
          text={unit.material ? '자재' : '제품'}
          bgColor={unit.material ? 'bg-yellow-8' : 'bg-green-8'}
          textColor={unit.material ? 'text-yellow' : 'text-green'}
          radius="rounded-sm"
        />
      </div>
      <p
        className="flex-1 px-3 truncate"
        title={
          unit.material ? unit.material.toString() : unit.product?.toString()
        }
      >
        {unit.material ? unit.material.toString() : unit.product?.toString()}
      </p>
      <p className="flex-1 px-3">
        {unit.from_unit}/{unit.to_unit}
      </p>
      <p className="flex-1 px-3">
        1{unit.from_unit}={unit.conversion_rate}
        {unit.to_unit}
      </p>
      <p className="flex-1 px-3">{unit.decimal_rule}</p>
      <div className="flex-[0.4] px-3">
        <button className="w-9 h-9 flex items-center justify-center group">
          <Trash
            size={16}
            className="text-sv group-hover:text-red transition-colors cursor-pointer"
          />
        </button>
      </div>
    </div>
  );
};
