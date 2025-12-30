'use client';

import { useEffect, useState } from 'react';
import Modal from '@/ui/modal/modal';
import SubstituteMaterialItem from './substitute-material-item';
import { useSubstitutesByMaterialQuery } from '@/hooks';
import Pagination from '@/components/pagination';

interface SubstituteMaterialsModalProps {
  materialId: number | null;
  onClose: () => void;
  onSelectMaterial?: (materialId: number) => void;
}

const SubstituteMaterialsModal = ({
  materialId,
  onClose,
  onSelectMaterial,
}: SubstituteMaterialsModalProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [materialId]);

  const {
    data: substituteListResponse,
    isLoading,
    error,
    refetch,
  } = useSubstitutesByMaterialQuery(
    materialId,
    !!materialId,
    currentPage,
    pageSize
  );

  const materials = substituteListResponse?.data ?? [];
  const totalPages = substituteListResponse?.pageCnt ?? 0;

  return (
    <Modal onClose={onClose} title="대체자재" width="w-[700px]">
      {!materialId || isLoading || error || materials.length === 0 ? (
        <div className="h-50" />
      ) : (
        <>
          <div className="mt-4 flex items-center h-12 border-t border-b border-lg Me_Body-1 cursor-default">
            <p className="flex-[1.2] px-3 text-sv">자재명</p>
            <p className="flex-1 px-3 text-sv">자재코드</p>
            <p className="flex-1 px-3 text-sv">규격</p>
            <p className="flex-1 px-3 text-sv">단위</p>
          </div>
          {materials.map((material) => (
            <SubstituteMaterialItem
              key={material.id}
              material={material}
              onSelectMaterial={onSelectMaterial}
              onUpdated={refetch}
            />
          ))}

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </Modal>
  );
};

export default SubstituteMaterialsModal;
