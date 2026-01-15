import { OcrDataModel, ProjectStatusType } from '@/types/data-model';
import { useTranslations } from 'next-intl';

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
    <div className="flex gap-4 items-center Heading-3 pb-1 pr-10 border-b border-lg">
      {(ocrData || hasUploadedFile) && (
        <button
          className={`${
            activeTab === 'quotation'
              ? 'text-primary underline decoration-primary decoration-2 underline-offset-8'
              : 'text-gr'
          } cursor-pointer`}
          onClick={activateQuotationTab}
        >
          {projectStatus === 'confirmed'
            ? tDocumentType('orderDocument')
            : tDocumentType('quotationRequest')}
        </button>
      )}
      <div
        className={`${
          activeTab === 'history'
            ? 'text-primary underline decoration-primary decoration-2 underline-offset-8'
            : 'text-gr'
        }`}
      >
        {tTabArea('history')}
      </div>
    </div>
  );
};

export default TabArea;
