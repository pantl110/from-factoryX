import { DocumentType } from './types';

interface MainTitleSecProps {
  selectedType: DocumentType;
  setSelectedType: (type: DocumentType) => void;
}

const MainTitleSec = ({ selectedType, setSelectedType }: MainTitleSecProps) => {
  const documentTypes = [
    '주문서',
    '생산지시서',
    '거래명세서',
    '매출 세금계산서',
    '매입 세금계산서',
  ];

  return (
    <div className="flex flex-col gap-8 pt-10 px-10">
      <h1 className="Heading-1 text-dg">문서함</h1>
      <div className="flex gap-4 items-center Heading-3">
        {documentTypes.map((type) => (
          <button
            key={type}
            type="button"
            className={`cursor-pointer Heading-3 ${selectedType === type ? 'text-dg' : 'text-gr'}`}
            onClick={() => setSelectedType(type as DocumentType)}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MainTitleSec;
