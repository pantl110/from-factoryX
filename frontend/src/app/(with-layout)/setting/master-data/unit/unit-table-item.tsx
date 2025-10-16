import Chip from '@/ui/chip';
import { UnitConversionData } from './mockData';
import { Trash } from '@phosphor-icons/react';
import IconBtn from '@/ui/icon-btn';

export const UnitTableItem = ({ unit }: { unit: UnitConversionData }) => {
  return (
    <div className="flex h-14 items-center px-3 w-full border-b border-lg Me_Body-1 text-dg hover:bg-bg transition-colors duration-200 cursor-pointer">
      <div className="flex-1 px-3">
        <Chip
          text={unit.category === '자재' ? '자재' : '제품'}
          bgColor={unit.category === '자재' ? 'bg-yellow-8' : 'bg-green-8'}
          textColor={unit.category === '자재' ? 'text-yellow' : 'text-green'}
          radius="rounded-sm"
        />
      </div>
      <p className="flex-1 px-3 truncate" title={unit.name}>
        {unit.name}
      </p>
      <p className="flex-1 px-3">{unit.standardConversionUnit}</p>
      <p className="flex-1 px-3">{unit.conversionFormula}</p>
      <p className="flex-1 px-3">{unit.decimalRule}</p>
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
