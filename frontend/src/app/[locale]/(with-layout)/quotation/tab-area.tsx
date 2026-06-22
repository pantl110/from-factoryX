import { OcrDataModel, ProjectStatusType } from '@/types/data-model';
import { useTranslations } from 'next-intl';
import { getTabItemClass } from '@/utils';

interface TabAreaProps {
  activeTab: 'quotation' | 'history';
  activateQuotationTab: () => void;
  ocrData: OcrDataModel | null;
  projectStatus: ProjectStatusType;
  hasUploadedFile?: boolean;
}

const TabArea = ({
  activeTab,
  activateQuotationTab,
  ocrData,
  projectStatus,
  hasUploadedFile = false,
}: TabAreaProps) => {
  const tDocumentType = useTranslations('document.type');
  const tTabArea = useTranslations('quotation.tabArea');

  return (
    <div className="flex gap-4 items-center Heading-3 pr-10 border-b border-lg">
      {(ocrData || hasUploadedFile) && (
        <button
          className={`pb-1 ${getTabItemClass(
            activeTab === 'quotation'
          )} cursor-pointer`}
          onClick={activateQuotationTab}
        >
          {projectStatus === 'confirmed'
            ? tDocumentType('orderDocument')
            : tDocumentType('quotationRequest')}
        </button>
      )}
      <div className={`pb-1 ${getTabItemClass(activeTab === 'history')}`}>
        {tTabArea('history')}
      </div>
    </div>
  );
};

export default TabArea;
