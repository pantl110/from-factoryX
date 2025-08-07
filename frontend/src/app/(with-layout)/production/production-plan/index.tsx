'use client';

import { useState, useEffect, useCallback } from 'react';
import ProductionPlanSaveModal from './modals/production-plan-save-modal';
import TableHeader from './table-header';
import TableItem from './table-item';
import {
  ProjectPlanModel,
  EquipmentResponseModel,
  ProjectStatusType,
} from '@/types/data-model';
import { OperationStatusType } from '@/types/status-type';
import usePageStatusStore from '@/store/page-status-store';
import OperationStatusDropdown from './modals/operation-status-dropdown';
import { createPortal } from 'react-dom';
import FacilityDropdown from './modals/facility-dropdown';
import {
  useGetProjectPlans,
  useUpdateProjectPlan,
  useGetEquipment,
  usePortalDropdown,
  useProductionPlanValidation,
  useToast,
} from '@/hooks';
import { useParams } from 'next/navigation';
import Spinner from '@/ui/spinner';
import Toast from '@/ui/toast';
import { WarningCircle } from '@phosphor-icons/react';

interface ProductionPlanProps {
  handleChangeStatus: (status: ProjectStatusType) => void;
  projectStatus?: ProjectStatusType;
}

const ProductionPlan = ({
  handleChangeStatus,
  projectStatus,
}: ProductionPlanProps) => {
  const params = useParams();
  const projectId = params.id ? parseInt(params.id as string) : null;

  // API 호출
  const { getProjectPlans, isLoading, error } = useGetProjectPlans();
  const { updateProjectPlan } = useUpdateProjectPlan();
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

  // 디바운스 타이머 저장
  const [debounceTimers, setDebounceTimers] = useState<
    Record<number, NodeJS.Timeout>
  >({});

  // 토스트 훅들
  const {
    isToastOpen: isEquipmentToastOpen,
    isVisible: isEquipmentToastVisible,
    showToast: showEquipmentToast,
  } = useToast(3000); // 설비 중복 사용 토스트
  const {
    isToastOpen: isTimeToastOpen,
    isVisible: isTimeToastVisible,
    showToast: showTimeToast,
  } = useToast(3000); // 시간 중복 토스트

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

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      Object.values(debounceTimers).forEach((timer) => {
        clearTimeout(timer);
      });
    };
  }, [debounceTimers]);

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

  // 가동 상태 변경 핸들러
  const handleOperationStatusChange = async (status: OperationStatusType) => {
    if (!operationStatusDropdownRowId) return;

    try {
      const result = await updateProjectPlan(operationStatusDropdownRowId, {
        status,
      });
      if (result.success) {
        // 상태 변경 성공 시 데이터 새로고침
        if (projectId) {
          const refreshResult = await getProjectPlans(projectId);
          if (refreshResult.success && refreshResult.data) {
            setProjectPlans(refreshResult.data);
          }
        }
      }
    } catch {
      alert('가동 상태 변경 중 오류가 발생했습니다.');
    }
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
      const currentFormData = formChanges[facilityDropdownRowId];
      const originalPlan = projectPlans.find(
        (p) => p.id === facilityDropdownRowId
      );

      // 가동중인 설비인지 확인
      if (originalPlan && currentFormData) {
        // 설비 충돌 검사 (다른 프로젝트에서 가동 중인지)
        const hasEquipmentConflict = projectPlans.some(
          (plan) =>
            plan.id !== facilityDropdownRowId &&
            plan.equipment.id === equipment.id &&
            plan.status === '가동 중'
        );

        if (hasEquipmentConflict) {
          showEquipmentToast();
          return; // 충돌이 있으면 설비 변경을 중단
        }
      }

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

  // 시간대 충돌 검사 함수
  const checkTimeConflicts = (
    planId: number,
    formData: ProductionPlanFormDataModel
  ) => {
    const originalPlan = projectPlans.find((p) => p.id === planId);
    if (!originalPlan) return false;

    // 시간대 충돌 검사
    return projectPlans.some((plan) => {
      if (plan.id === planId) return false; // 자기 자신은 제외

      // 같은 설비인지 확인
      if (plan.equipment.id !== formData.equipment_id) return false;

      // 날짜가 설정되어 있는지 확인
      if (
        !formData.start_date ||
        !formData.end_date ||
        !plan.start_date ||
        !plan.end_date
      )
        return false;

      // 날짜 형식을 Date 객체로 변환
      const newStartDate = new Date(formData.start_date);
      const newEndDate = new Date(formData.end_date);
      const existingStartDate = new Date(plan.start_date);
      const existingEndDate = new Date(plan.end_date);

      // 날짜 범위가 겹치는지 확인
      const hasOverlap =
        newStartDate < existingEndDate && newEndDate > existingStartDate;

      return hasOverlap;
    });
  };

  // 폼 변경 핸들러 //
  const handleFormChange = useCallback(
    (planId: number, formData: ProductionPlanFormDataModel) => {
      setFormChanges((prev) => ({
        ...prev,
        [planId]: formData,
      }));

      // 시간대 충돌 검사
      const hasTimeConflict = checkTimeConflicts(planId, formData);

      if (hasTimeConflict) {
        showTimeToast();
        return;
      }

      setDebounceTimers((prevTimers) => {
        if (prevTimers[planId]) clearTimeout(prevTimers[planId]);
        const newTimer = setTimeout(async () => {
          // 생산일자나 마감예정일자가 변경된 경우, 두 필드가 모두 완전히 입력되어야 저장
          const originalPlan = projectPlans.find((p) => p.id === planId);
          if (!originalPlan) return;

          const isDateFieldChanged =
            formData.start_date !== originalPlan.start_date ||
            formData.end_date !== originalPlan.end_date;

          if (
            isDateFieldChanged &&
            (!formData.start_date || !formData.end_date)
          ) {
            return; // 날짜 필드가 변경되었는데 완전히 입력되지 않으면 저장하지 않음
          }

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
            const result = await updateProjectPlan(planId, changes);
            if (result.success) {
              // 저장 성공 시에만 데이터 새로고침
              if (projectId) {
                const refreshResult = await getProjectPlans(projectId);
                if (refreshResult.success && refreshResult.data) {
                  setProjectPlans(refreshResult.data);
                  // formChanges에서 해당 plan의 변경사항 제거 (무한 루프 방지)
                  setFormChanges((prev) => {
                    const newChanges = { ...prev };
                    delete newChanges[planId];
                    return newChanges;
                  });
                }
              }
            }
          }
        }, 1000);
        return { ...prevTimers, [planId]: newTimer };
      });
    },
    [
      projectPlans,
      updateProjectPlan,
      getProjectPlans,
      projectId,
      showEquipmentToast,
    ]
  );

  // 변경된 모든 생산 계획들을 한 번에 저장하는 함수
  const saveProjectPlans = async () => {
    try {
      // 저장 전에 시간대 충돌만 검사 (설비 충돌은 선택 시점에서 이미 검사됨)
      for (const [planId, formData] of Object.entries(formChanges)) {
        const timeConflict = checkTimeConflicts(parseInt(planId), formData);
        if (timeConflict) {
          showTimeToast();
          return { success: false, error: '시간대 충돌' };
        }
      }

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

      return { success: true };
    } catch {
      alert('생산 계획 저장 중 오류가 발생했습니다.');
      return { success: false };
    }
  };

  // 프로젝트 상태를 다음 단계로 변경하는 함수
  const changeProjectStatus = async () => {
    try {
      if (projectId) {
        await handleChangeStatus('production');
      }
      return { success: true };
    } catch {
      alert('프로젝트 상태 변경 중 오류가 발생했습니다.');
      return { success: false };
    }
  };

  const handleProductionPlanSave = async () => {
    // 다음 버튼 누르면 // 변경된 생산 계획들을 한 번에 저장
    try {
      // 1. 생산 계획 저장
      const saveResult = await saveProjectPlans();
      if (!saveResult.success) {
        // 시간대 충돌이 있으면 저장 중단
        if (saveResult.error === '시간대 충돌') {
          showTimeToast();
          return;
        }
        return;
      }

      // 2. 프로젝트 상태 변경
      const statusResult = await changeProjectStatus();
      if (!statusResult.success) {
        return;
      }

      // 3. 변경사항 초기화 및 모달 닫기
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
      <div className="mx-10 pt-4 mb-10">
        <div className="w-full overflow-x-auto">
          <TableHeader />
          {projectPlans.map((item) => (
            <TableItem
              key={item.id}
              item={item}
              onOperationStatusClick={
                projectStatus === 'pending' || projectStatus === '생산 대기'
                  ? undefined
                  : (e) => handleOperationStatusClick(e, item.id)
              }
              onFacilityClick={(e) => handleFacilityClick(e, item.id)}
              onFormChange={handleFormChange}
              formData={formChanges[item.id]}
              equipments={equipmentList?.data || []}
              projectStatus={projectStatus}
            />
          ))}
        </div>
      </div>

      {/* 드랍다운 */}
      {operationStatusDropdownRowId !== null &&
        isOperationStatusDropdownOpen &&
        operationStatusAnchorRect &&
        createPortal(
          <OperationStatusDropdown
            onClose={handleCloseOperationStatusModal}
            onStatusChange={handleOperationStatusChange}
            style={{
              position: 'fixed',
              left: operationStatusAnchorRect.left - 12,
              top: operationStatusAnchorRect.bottom + 8,
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

      {/* 다음 버튼 모달 // 생산대기 시 */}
      {isProductionPlanSaveModalOpen && (
        <ProductionPlanSaveModal
          onClose={() => {
            setProductionPlanSaveModalOpen(false);
          }}
          onSave={handleProductionPlanSave}
        />
      )}

      {/* 설비 중복 사용 토스트 */}
      {isEquipmentToastOpen && (
        <Toast
          text="해당 설비는 다른 프로젝트에서 이미 사용 중이에요."
          subtext="중복 등록을 피하려면 설비를 변경해 주세요."
          icon={<WarningCircle size={20} className="text-red" />}
          type="red"
          isVisible={isEquipmentToastVisible}
        />
      )}

      {/* 시간대 중복 토스트 */}
      {isTimeToastOpen && (
        <Toast
          text="이미 해당 시간대에 같은 설비가 등록되어 있어요."
          subtext="다른 시간대나 설비로 변경해 주세요."
          icon={<WarningCircle size={20} className="text-red" />}
          type="red"
          isVisible={isTimeToastVisible}
        />
      )}
    </>
  );
};

export default ProductionPlan;
