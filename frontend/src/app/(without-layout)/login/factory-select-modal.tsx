import { useState } from 'react';
import Modal from '@/ui/modal/modal';
import { FactoriesResponseModel } from '@/types/data-model';

interface FactorySelectModalProps {
  factories: FactoriesResponseModel[];
  onSelectFactory: (factoryId: number) => void;
  onClose: () => void;
}

const FactorySelectModal = ({
  factories,
  onSelectFactory,
  onClose,
}: FactorySelectModalProps) => {
  const [selectedFactoryId, setSelectedFactoryId] = useState<number | null>(
    null
  );

  const handleConfirm = () => {
    if (selectedFactoryId) {
      onSelectFactory(selectedFactoryId);
    }
  };

  return (
    <Modal
      title="공장 선택"
      subtitle="사용할 공장을 선택해주세요."
      onClose={onClose}
      width="w-[600px]"
    >
      <div className="mt-6 space-y-3">
        {factories.map((factory) => (
          <div
            key={factory.id}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedFactoryId === factory.id
                ? 'border-primary bg-primary-8'
                : 'border-lg hover:border-primary hover:bg-primary-8'
            }`}
            onClick={() => setSelectedFactoryId(factory.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="Heading-4 text-dg">{factory.name}</h4>
                {factory.business_registration_number && (
                  <p className="Re_Body-2 text-sv mt-1">
                    사업자등록번호: {factory.business_registration_number}
                  </p>
                )}
                {factory.representative_name && (
                  <p className="Re_Body-2 text-sv">
                    대표자: {factory.representative_name}
                  </p>
                )}
              </div>
              {selectedFactoryId === factory.id && (
                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sv border border-lg rounded-lg hover:bg-bg transition-colors"
        >
          취소
        </button>
        <button
          onClick={handleConfirm}
          disabled={!selectedFactoryId}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedFactoryId
              ? 'bg-primary text-white hover:bg-primary-hover'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          선택
        </button>
      </div>
    </Modal>
  );
};

export default FactorySelectModal;
