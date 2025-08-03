'use client';

import { useState, useEffect } from 'react';
import ProductionPlanSaveModal from './modals/production-plan-save-modal';
import TableHeader from './table-header';
import TableItem from './table-item';
import { ProjectPlanModel, EquipmentResponseModel } from '@/types/data-model';
import usePageStatusStore from '@/store/page-status-store';
import OperationStatusDropdown from './modals/operation-status-dropdown';
import { createPortal } from 'react-dom';
import FacilityDropdown from './modals/facility-dropdown';
import {
  useGetProjectPlans,
  useUpdateProjectPlan,
  useGetEquipment,
  usePortalDropdown,
  useUpdateProjectStatus,
  useProductionPlanValidation,
} from '@/hooks';
import { useParams } from 'next/navigation';
import Spinner from '@/ui/spinner';

const ProductionPlan = () => {
  const params = useParams();
  const projectId = params.id ? parseInt(params.id as string) : null;

  // API 호출
  const { getProjectPlans, isLoading, error } = useGetProjectPlans();
  const { updateProjectPlan } = useUpdateProjectPlan();
  const { updateProjectStatus } = useUpdateProjectStatus();
  const { equipmentList } = useGetEquipment();
  const [projectPlans, setProjectPlans] = useState<ProjectPlanModel[]>([]);

  // Form 데이터 저장
  interface ProductionPlanFormDataModel {
    quantity: number;
    equipment_id: number;
    start_date: string;
    end_date: string;
  }
  const [formChanges, setFormChanges] = useState<
    Record<number, ProductionPlanFormDataModel>
  >({});

  // production의 "생산 대기" 상태의 "생산 계획" 탭에서 저장 버튼 클릭 시 모달 오픈
  const isProductionPlanSaveModalOpen = usePageStatusStore(
    (state) => state.isProductionPlanSaveModalOpen
  );
  const setProductionPlanSaveModalOpen = usePageStatusStore(
    (state) => state.setProductionPlanSaveModalOpen
  );

  // 프로젝트 계획 데이터 로드
  useEffect(() => {
    const loadProjectPlans = async () => {
      if (!projectId) return;

      const result = await getProjectPlans(projectId);
      if (result.success && result.data) {
        setProjectPlans(result.data);

        // formChanges를 원본 데이터로 초기화
        const initialFormData: Record<number, ProductionPlanFormDataModel> = {};
        result.data.forEach((plan) => {
          initialFormData[plan.id] = {
            quantity: plan.quantity,
            equipment_id: plan.equipment.id,
            start_date: plan.start_date,
            end_date: plan.end_date,
          };
        });
        setFormChanges(initialFormData);
      }
    };

    loadProjectPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // 생산 계획 검증 훅 사용
  useProductionPlanValidation(projectPlans, formChanges);

  // 가동상태 드랍다운운을 row별로 관리
  const {
    isOpen: isOperationStatusDropdownOpen,
    openDropdown: openOperationStatusDropdown,
    closeDropdown: closeOperationStatusDropdown,
    anchorRect: operationStatusAnchorRect,
  } = usePortalDropdown();
  const [operationStatusDropdownRowId, setOperationStatusDropdownRowId] =
    useState<number | null>(null);
  const handleOperationStatusClick = (e: React.MouseEvent, rowId: number) => {
    openOperationStatusDropdown(e);
    setOperationStatusDropdownRowId(rowId);
  };
  const handleCloseOperationStatusModal = () => {
    setOperationStatusDropdownRowId(null);
    closeOperationStatusDropdown();
  };

  // 시설 드랍다운을 row별로 관리
  const {
    isOpen: isFacilityDropdownOpen,
    openDropdown: openFacilityDropdown,
    closeDropdown: closeFacilityDropdown,
    anchorRect: facilityAnchorRect,
  } = usePortalDropdown();
  const [facilityDropdownRowId, setFacilityDropdownRowId] = useState<
    number | null
  >(null);
  // 설비 드롭다운 열고 닫는 핸들러
  const handleFacilityClick = (e: React.MouseEvent, rowId: number) => {
    openFacilityDropdown(e);
    setFacilityDropdownRowId(rowId); // 어떤 행의 설비 드롭다운을 열지 저장
  };
  const handleCloseFacilityDropdown = () => {
    setFacilityDropdownRowId(null);
    closeFacilityDropdown();
  };

  // 설비 선택 핸들러
  const handleEquipmentSelect = (equipment: EquipmentResponseModel) => {
    if (facilityDropdownRowId) {
      // form 데이터에 설비 변경 반영
      setFormChanges((prev) => ({
        ...prev,
        [facilityDropdownRowId]: {
          ...prev[facilityDropdownRowId],
          equipment_id: equipment.id,
          quantity:
            prev[facilityDropdownRowId]?.quantity ||
            projectPlans.find((p) => p.id === facilityDropdownRowId)
              ?.quantity ||
            0,
          start_date:
            prev[facilityDropdownRowId]?.start_date ||
            projectPlans.find((p) => p.id === facilityDropdownRowId)
              ?.start_date ||
            '',
          end_date:
            prev[facilityDropdownRowId]?.end_date ||
            projectPlans.find((p) => p.id === facilityDropdownRowId)
              ?.end_date ||
            '',
        },
      }));
    }
  };

  // Form 변경 handler
  const handleFormChange = (
    planId: number,
    formData: ProductionPlanFormDataModel
  ) => {
    setFormChanges((prev) => ({
      ...prev,
      [planId]: formData,
    }));
  };

  const handleProductionPlanSave = async () => {
    // 다음 버튼 누르면 // 변경된 생산 계획들을 한 번에 저장
    try {
      const updatePromises = Object.entries(formChanges).map(
        ([planId, formData]) => {
          const originalPlan = projectPlans.find(
            (p) => p.id === parseInt(planId)
          );
          if (!originalPlan) return Promise.resolve();

          // 변경된 것만 업데이트
          const changes: Record<string, unknown> = {};
          if (formData.quantity !== originalPlan.quantity)
            changes.quantity = formData.quantity;
          if (formData.equipment_id !== originalPlan.equipment.id)
            changes.equipment_id = formData.equipment_id;
          if (formData.start_date !== originalPlan.start_date)
            changes.start_date = formData.start_date;
          if (formData.end_date !== originalPlan.end_date)
            changes.end_date = formData.end_date;

          if (Object.keys(changes).length > 0) {
            return updateProjectPlan(parseInt(planId), changes);
          }
          return Promise.resolve({ success: true });
        }
      );

      await Promise.all(updatePromises);

      // 저장 후 데이터 새로고침
      if (projectId) {
        const result = await getProjectPlans(projectId);
        if (result.success && result.data) {
          setProjectPlans(result.data);
        }
      }

      // 프로젝트 상태를 다음 단계로 변경
      if (projectId) {
        const statusResult = await updateProjectStatus(projectId, '생산 중');
        if (!statusResult.success) {
          // console.error('프로젝트 상태 변경 실패:', statusResult.error);
        } else {
          // 상태 변경 성공 시 페이지 reload
          window.location.reload();
        }
      }

      // 변경사항 초기화
      setFormChanges({});
      setProductionPlanSaveModalOpen(false);
    } catch {
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 로딩 상태 처리
  if (isLoading || error) {
    return (
      <div className="flex items-center justify-center h-100">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <div className="mx-10 pt-4 pb-10">
        <div className="w-full overflow-x-auto">
          <TableHeader />
          {projectPlans.map((item) => (
            <TableItem
              key={item.id}
              item={item}
              // onOperationStatusClick={(e) =>
              //   handleOperationStatusClick(e, item.id)
              // }
              onFacilityClick={(e) => handleFacilityClick(e, item.id)}
              onFormChange={handleFormChange}
              formData={formChanges[item.id]}
              equipments={equipmentList?.data || []}
            />
          ))}
        </div>
      </div>

      {operationStatusDropdownRowId !== null &&
        isOperationStatusDropdownOpen &&
        operationStatusAnchorRect &&
        createPortal(
          <OperationStatusDropdown
            onClose={handleCloseOperationStatusModal}
            style={{
              position: 'fixed',
              left: operationStatusAnchorRect.left,
              top: operationStatusAnchorRect.bottom,
              zIndex: 10,
            }}
          />,
          document.body
        )}

      {facilityDropdownRowId !== null &&
        isFacilityDropdownOpen &&
        facilityAnchorRect &&
        createPortal(
          <FacilityDropdown
            onClose={handleCloseFacilityDropdown}
            equipments={equipmentList?.data || []}
            onSelect={handleEquipmentSelect}
            style={{
              position: 'fixed',
              left: facilityAnchorRect.left - 12,
              top: facilityAnchorRect.bottom + 11,
              width: facilityAnchorRect.width + 24,
              zIndex: 10,
            }}
          />,
          document.body
        )}

      {isProductionPlanSaveModalOpen && (
        <ProductionPlanSaveModal
          onClose={() => {
            setProductionPlanSaveModalOpen(false);
          }}
          onSave={handleProductionPlanSave}
        />
      )}
    </>
  );
};

export default ProductionPlan;
