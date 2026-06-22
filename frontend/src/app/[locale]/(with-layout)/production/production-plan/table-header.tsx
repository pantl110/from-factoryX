import { useTranslations } from 'next-intl';
import { tableHeader } from './types';

const TableHeader = () => {
  const tTableHeaders = useTranslations(
    'production.productionPlan.tableHeaders'
  );
  const tCommon = useTranslations('common');
  const tProductionInfo = useTranslations('production.productionInfo');

  const getHeaderText = (name: string) => {
    if (!name) return '';

    // productionPlan.tableHeaders에 있는 것들
    if (name === 'operationStatus' || name === 'materialStatus') {
      return tTableHeaders(name);
    }

    // common에 있는 것들
    const commonKeys: Record<string, string> = {
      productName: 'productName',
      productCode: 'productCode',
      specification: 'specification',
      unit: 'unit',
      productionQuantity: 'productionQty',
      productionDate: 'productionDate',
      expectedCompletionDate: 'expectedCompletionDate',
      equipment: 'productionEquipment',
    };

    if (commonKeys[name]) {
      return tCommon(commonKeys[name]);
    }

    // productionInfo에 있는 것들
    if (name === 'orderQuantity') {
      return tProductionInfo('orderQuantity');
    }

    if (name === 'productionTimePerUnit') {
      return tProductionInfo('timePerUnit');
    }

    return '';
  };

  return (
    <div className="flex items-center min-w-[1920px] h-12 Me_Body-3 bg-bg rounded text-sv sticky top-0 z-1 cursor-default">
      {tableHeader.map((header) => (
        <p key={header.name} className={`${header.width} px-3`}>
          {getHeaderText(header.name)}
        </p>
      ))}
    </div>
  );
};

export default TableHeader;
