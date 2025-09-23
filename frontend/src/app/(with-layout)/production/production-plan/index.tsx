'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  useCreateOrUpdateProjectPlan,
  useDeleteProjectPlan,
  useGetEquipment,
  usePortalDropdown,
  useProductionPlanValidation,
  useToast,
} from '@/hooks';
import { useParams } from 'next/navigation';
import Spinner from '@/ui/spinner';
import Toast from '@/ui/toast';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { useDebouncedCallback } from 'use-debounce';
import { checkDateValidity } from '@/utils/date-validation';

// UTC 시간을 한국 시간(+9시간)으로 변환하는 함수 (표시용만)
const convertUTCToKST = (utcDateString: string | null): string => {
  if (!utcDateString) return '';

  // ISO 형식(2025-08-24T04:13:00Z) 또는 일반 형식 모두 처리
  const utcDate = new Date(utcDateString);

  // 유효한 날짜인지 확인
  if (isNaN(utcDate.getTime())) return '';

  // 9시간(9 * 60 * 60 * 1000ms) 추가
  const kstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);

  // YYYY-MM-DD HH:mm 형식으로 반환
  return kstDate.toISOString().slice(0, 16).replace('T', ' ');
};

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
  const { createOrUpdateProjectPlan } = useCreateOrUpdateProjectPlan();
  const { deleteProjectPlan } = useDeleteProjectPlan();
  const { getAllEquipmentList } = useGetEquipment();
  const [projectPlans, setProjectPlans] = useState<ProjectPlanModel[]>([]);
  const [allEquipments, setAllEquipments] = useState<EquipmentResponseModel[]>(
    []
  );

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

  // 저장 중 로딩 상태
  const [isSaveLoading, setIsSaveLoading] = useState(false);

  // 추가 생산 계획 생성 함수 (바로 DB에 저장)
  const handleAddPlan = useCallback(
    async (planData: ProductionPlanFormDataModel, parentPlanId: number) => {
      try {
        if (!projectId) return;

        // 부모 계획 찾기
        const parentPlan = projectPlans.find(
          (plan) => plan.id === parentPlanId
        );
        if (!parentPlan) {
          throw new Error('부모 계획을 찾을 수 없습니다.');
        }

        // DB에 저장하지 않고 임시 플랜을 로컬 상태에만 추가
        const tempId = -Date.now();
        const newPlan = {
          id: tempId, // 임시 ID (음수)
          quantity: planData.quantity,
          equipment: {
            id: planData.equipment_id || 0,
            name:
              allEquipments.find((eq) => eq.id === planData.equipment_id)
                ?.name || '설비',
          },
          start_date: '',
          end_date: '',
          status: 'pending',
          material_status: parentPlan.material_status,
          avg_production_time: parentPlan.avg_production_time,
          quotation_product: {
            id: parentPlan.quotation_product.id,
            quantity: parentPlan.quotation_product.quantity,
            is_delivery: false,
            product: parentPlan.quotation_product.product,
          },
        } as ProjectPlanModel & { is_new?: boolean };
        newPlan.is_new = true;

        setProjectPlans((prev) => {
          const parentIndex = prev.findIndex(
            (plan) => plan.id === parentPlanId
          );
          if (parentIndex === -1) {
            return [...prev, newPlan];
          }
          const newPlans = [...prev];
          newPlans.splice(parentIndex + 1, 0, newPlan);
          return newPlans;
        });

        // formChanges에도 추가 (초기값으로 설정)
        setFormChanges((prev) => ({
          ...prev,
          [tempId]: { ...planData, start_date: '', end_date: '' },
        }));
      } catch {
        alert('추가 생산 계획 생성 중 오류가 발생했습니다.');
      }
    },
    [projectId, projectPlans, allEquipments]
  );

  // 토스트 훅들
  const {
    isToastOpen: isEquipmentToastOpen,
    isVisible: isEquipmentToastVisible,
    showToast: showEquipmentToast,
  } = useToast(); // 설비 중복 사용 토스트
  const {
    isToastOpen: isTimeToastOpen,
    isVisible: isTimeToastVisible,
    showToast: showTimeToast,
  } = useToast(); // 시간 중복 토스트
  const {
    isToastOpen: isDeleteToastOpen,
    isVisible: isDeleteToastVisible,
    showToast: showDeleteToast,
  } = useToast(); // 삭제 불가 토스트
  const {
    isToastOpen: isSaveToastOpen,
    isVisible: isSaveToastVisible,
    showToast: showSaveToast,
  } = useToast(); // 생산 계획 저장 토스트
  const {
    isToastOpen: isDateToastOpen,
    isVisible: isDateToastVisible,
    showToast: showDateToast,
  } = useToast(); // 유효한 날짜 토스트

  // production의 "생산 대기" 상태의 "생산 계획" 탭에서 저장 버튼 클릭 시 모달 오픈
  const isProductionPlanSaveModalOpen = usePageStatusStore(
    (state) => state.isProductionPlanSaveModalOpen
  );
  const setProductionPlanSaveModalOpen = usePageStatusStore(
    (state) => state.setProductionPlanSaveModalOpen
  );
  // 모든 품목이 가동 완료 상태인지 여부 확인
  const setAllProductionCompleted = usePageStatusStore(
    (state) => state.setAllProductionCompleted
  );

  // 전체 설비 목록 로드 (초기 로드만)
  useEffect(() => {
    const loadAllEquipments = async () => {
      try {
        const result = await getAllEquipmentList();
        if (result && result.data) {
          setAllEquipments(result.data);
        }
      } catch (error) {
        console.error('전체 설비 목록 로드 실패:', error);
      }
    };

    loadAllEquipments();
  }, [getAllEquipmentList]);

  // 프로젝트 계획 데이터 로드 (초기 로드만)
  useEffect(() => {
    const loadProjectPlans = async () => {
      if (!projectId) return;

      const result = await getProjectPlans(projectId);
      if (result.success && result.data) {
        // DB에서 받은 날짜 데이터를 +9시간(KST)으로 변환해서 저장
        const plansWithKSTDates = result.data.map((plan: ProjectPlanModel) => ({
          ...plan,
          start_date: plan.start_date ? convertUTCToKST(plan.start_date) : '',
          end_date: plan.end_date ? convertUTCToKST(plan.end_date) : '',
        }));

        setProjectPlans((prev) => {
          const tempPlans = prev.filter((p) => (p.id ?? 0) < 0);
          if (tempPlans.length === 0) return plansWithKSTDates;

          const merged = [...plansWithKSTDates];
          // 임시 플랜을 동일 품목의 마지막 플랜 바로 뒤에 삽입
          tempPlans.forEach((tp) => {
            const sameProductIndexes: number[] = [];
            merged.forEach((p, idx) => {
              if (p.quotation_product.id === tp.quotation_product.id) {
                sameProductIndexes.push(idx);
              }
            });
            const insertIdx =
              sameProductIndexes.length > 0
                ? sameProductIndexes[sameProductIndexes.length - 1] + 1
                : merged.length;
            merged.splice(insertIdx, 0, tp);
          });
          return merged;
        });

        // formChanges를 변환된 데이터로 초기화
        const initialFormData: Record<number, ProductionPlanFormDataModel> = {};
        plansWithKSTDates.forEach((plan: ProjectPlanModel) => {
          initialFormData[plan.id] = {
            quantity: plan.quantity,
            equipment_id: plan.equipment.id,
            start_date: plan.start_date || '',
            end_date: plan.end_date || '',
          };
        });
        setFormChanges((prev) => ({
          // 기존 임시 플랜 입력값 보존 + 서버 값 채우기
          ...prev,
          ...initialFormData,
        }));
      }
    };

    loadProjectPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // 생산 계획 검증 훅 사용
  useProductionPlanValidation(projectPlans, formChanges);

  // 초기 진입 시 부족 수량이 있으면 임시 플랜 즉시 생성 (DB 저장 전)
  const initialSeededRef = useRef(false);
  useEffect(() => {
    if (initialSeededRef.current) return;
    if (!projectId) return;
    if (!projectPlans.length) return;

    // 제품별 그룹핑
    const grouped: Record<number, ProjectPlanModel[]> = {};
    for (const plan of projectPlans) {
      const qpId = plan.quotation_product.id;
      if (!grouped[qpId]) grouped[qpId] = [];
      grouped[qpId].push(plan);
    }

    Object.values(grouped).forEach((plans) => {
      // 초기 진입 시: 생성 여부 판단은 주문수량 기준, 추천 수량은 버퍼 포함
      const orderQty = plans[0].quotation_product.quantity;
      const targetTotal = orderQty;
      const totalQty = plans.reduce((sum, p) => {
        const q = formChanges[p.id]?.quantity ?? p.quantity;
        return sum + q;
      }, 0);

      if (totalQty < targetTotal) {
        // 추천 수량은 버퍼 포함 목표치로 계산
        const bufferRate =
          plans[0].quotation_product.product?.buffer_rate ?? 0.1;
        const bufferedTarget = orderQty + Math.ceil(orderQty * bufferRate);
        const autoQty = Math.max(0, bufferedTarget - totalQty);
        if (autoQty > 0) {
          const last = plans[plans.length - 1];
          const equipmentId = last.equipment.id;
          const startDate = last.start_date
            ? new Date(last.start_date)
                .toISOString()
                .slice(0, 16)
                .replace('T', ' ')
            : '';
          const endDate = last.end_date
            ? new Date(last.end_date)
                .toISOString()
                .slice(0, 16)
                .replace('T', ' ')
            : '';
          handleAddPlan(
            {
              quantity: autoQty,
              equipment_id: equipmentId,
              start_date: startDate,
              end_date: endDate,
            },
            last.id
          );
        }
      }
    });

    initialSeededRef.current = true;
  }, [projectId, projectPlans, formChanges, handleAddPlan]);

  // 모든 품목이 가동 완료 상태인지 확인
  const isAllProductionCompleted = projectPlans.every(
    (plan) => plan.status === 'completed'
  );
  // 모든 품목이 가동 완료 상태일 때 store 업데이트
  useEffect(() => {
    setAllProductionCompleted(isAllProductionCompleted);
  }, [isAllProductionCompleted, setAllProductionCompleted]);

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
    if (!operationStatusDropdownRowId || !projectId) return;

    // 해당 계획이 존재하는지 확인
    const targetPlan = projectPlans.find(
      (plan) => plan.id === operationStatusDropdownRowId
    );
    if (!targetPlan) {
      alert('가동 상태를 변경할 계획을 찾을 수 없습니다.');
      return;
    }

    try {
      const result = await createOrUpdateProjectPlan({
        project_id: projectId,
        quotation_product_id: targetPlan.quotation_product.id,
        equipment_id: targetPlan.equipment.id,
        quantity: targetPlan.quantity,
        start_date: targetPlan.start_date,
        end_date: targetPlan.end_date,
        avg_production_time: targetPlan.avg_production_time,
        status, // 가동 상태 추가
        plan_id: operationStatusDropdownRowId, // 모든 plan이 이제 DB에 저장되므로 항상 ID 사용
        total_amount: targetPlan.quotation_product.quantity,
        total_quantity: projectPlans
          .filter(
            (plan) =>
              plan.quotation_product.id === targetPlan.quotation_product.id
          )
          .reduce((sum, plan) => {
            // formChanges에 변경사항이 있으면 그 값 사용
            const planFormData = formChanges[plan.id];
            const quantity = planFormData?.quantity ?? plan.quantity;
            return sum + quantity;
          }, 0),
      });
      if (result.success) {
        // 상태 변경 성공 시 해당 plan의 상태만 업데이트
        setProjectPlans((prev) =>
          prev.map((plan) =>
            plan.id === operationStatusDropdownRowId
              ? { ...plan, status }
              : plan
          )
        );
      } else {
        alert('가동 상태 변경에 실패했습니다.');
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

  // Plan 삭제 핸들러
  const handleDeletePlan = useCallback(
    async (planId: number) => {
      // 삭제할 plan 찾기
      const planToDelete = projectPlans.find((plan) => plan.id === planId);
      if (!planToDelete) return;

      // 삭제 후 해당 품목의 총 생산수량 계산 (로컬 변경 반영)
      const remainingTotalQuantity = projectPlans
        .filter(
          (plan) =>
            plan.quotation_product.id === planToDelete.quotation_product.id &&
            plan.id !== planId // 삭제할 plan 제외
        )
        .reduce((sum, plan) => {
          // formChanges에 변경사항이 있으면 그 값 사용
          const formData = formChanges[plan.id];
          return sum + (formData?.quantity ?? plan.quantity);
        }, 0);

      const orderQuantity = planToDelete.quotation_product.quantity;

      // 임시 플랜(음수 ID)은 로컬에서만 삭제. 하지만 수량 부족이면 삭제 금지
      if (planId < 0) {
        if (remainingTotalQuantity < orderQuantity) {
          showDeleteToast();
          return;
        }
        setProjectPlans((prev) => prev.filter((plan) => plan.id !== planId));
        setFormChanges((prev) => {
          const next: Record<number, ProductionPlanFormDataModel> = { ...prev };
          delete next[planId];
          return next;
        });
        return;
      }

      // 삭제 후 해당 품목의 총 생산수량 계산

      // 삭제 후 생산수량이 주문수량보다 작으면 삭제 금지
      if (remainingTotalQuantity < orderQuantity) {
        showDeleteToast();
        return;
      }

      // 삭제
      try {
        const result = await deleteProjectPlan(planId);
        if (result.success) {
          // 삭제 성공 시 로컬 상태에서도 제거
          setProjectPlans((prev) => prev.filter((plan) => plan.id !== planId));
          // formChanges에서도 제거
          setFormChanges((prev) => {
            const newChanges = { ...prev };
            delete newChanges[planId];
            return newChanges;
          });
        } else {
          // 삭제 실패 시 에러 처리
          alert('생산 계획 삭제에 실패했습니다.');
        }
      } catch {
        alert('삭제 중 오류가 발생했습니다.');
      }
    },
    [deleteProjectPlan, projectPlans, formChanges, showDeleteToast]
  );

  // 설비 선택 핸들러
  const handleEquipmentSelect = (equipment: EquipmentResponseModel) => {
    if (!facilityDropdownRowId) return;

    // 설비 충돌 검사 (경고용 - 변경은 허용)
    const currentFormData = formChanges[facilityDropdownRowId];
    if (currentFormData) {
      const formDataWithNewEquipment = {
        ...currentFormData,
        equipment_id: equipment.id, // 새로 선택한 설비
      };
      const hasEquipmentConflict = checkEquipmentConflicts(
        facilityDropdownRowId,
        formDataWithNewEquipment
      );

      if (hasEquipmentConflict) {
        showEquipmentToast(); // 경고만 표시, 변경은 계속 진행
      }
    }

    // 설비 ID 업데이트 (충돌이 있어도 변경 허용)
    setFormChanges((prev) => ({
      ...prev,
      [facilityDropdownRowId]: {
        ...prev[facilityDropdownRowId],
        equipment_id: equipment.id,
      },
    }));

    // 드롭다운 닫기
    handleCloseFacilityDropdown();
  };

  // 시간대 충돌 검사 함수
  const checkTimeConflicts = useCallback(
    (planId: number, formData: ProductionPlanFormDataModel) => {
      const originalPlan = projectPlans.find((p) => p.id === planId);
      if (!originalPlan) return false;

      // 시간대 충돌 검사 (formChanges 반영)
      return projectPlans.some((plan) => {
        if (plan.id === planId) return false; // 자기 자신은 제외

        // 해당 plan의 formChanges가 있으면 그 값 사용, 없으면 원본 사용
        const planFormData = formChanges[plan.id];
        const equipmentId = planFormData?.equipment_id ?? plan.equipment.id;
        const startDate = planFormData?.start_date ?? plan.start_date;
        const endDate = planFormData?.end_date ?? plan.end_date;

        // 같은 설비인지 확인
        if (equipmentId !== formData.equipment_id) return false;

        // 날짜가 설정되어 있는지 확인
        if (
          !formData.start_date ||
          !formData.end_date ||
          !startDate ||
          !endDate
        )
          return false;

        // 날짜 형식을 Date 객체로 변환
        const newStartDate = new Date(formData.start_date);
        const newEndDate = new Date(formData.end_date);
        const existingStartDate = new Date(startDate);
        const existingEndDate = new Date(endDate);

        // 날짜 범위가 겹치는지 확인
        const hasOverlap =
          newStartDate < existingEndDate && newEndDate > existingStartDate;

        return hasOverlap;
      });
    },
    [projectPlans, formChanges]
  );

  // 설비 중복 검사 함수
  const checkEquipmentConflicts = useCallback(
    (planId: number, formData: ProductionPlanFormDataModel) => {
      // 다른 프로젝트에서 가동 중인 설비인지 확인 (formChanges 반영)
      const hasEquipmentConflict = projectPlans.some((plan) => {
        if (plan.id === planId) return false; // 자기 자신은 제외

        // 해당 plan의 formChanges가 있으면 그 값 사용, 없으면 원본 사용
        const planFormData = formChanges[plan.id];
        const equipmentId = planFormData?.equipment_id ?? plan.equipment.id;

        return (
          equipmentId === formData.equipment_id && plan.status === 'production'
        );
      });

      return hasEquipmentConflict;
    },
    [projectPlans, formChanges]
  );

  // 생산수량 체크 로직 (디바운스 적용 전)
  const checkQuantityAndCreatePlan = useCallback(
    (planId: number, formData: ProductionPlanFormDataModel) => {
      const currentPlan = projectPlans.find((p) => p.id === planId); // 현재 plan이 존재하는지
      if (!currentPlan) return;
      // 사용자가 아직 입력하지 않았거나 0을 입력한 경우 자동 생성하지 않음
      if (formData.quantity === 0) return;
      // 수량이 실제로 변경되었는지 확인
      if (formData.quantity === currentPlan.quantity) return;

      // 같은 품목의 어떤 plan이라도 수량이 0이면, 입력 중으로 간주하고 자동 생성하지 않음
      const hasZeroQuantityPlan = projectPlans
        .filter(
          (plan) =>
            plan.quotation_product.id === currentPlan.quotation_product.id
        )
        .some((plan) => {
          const override = formChanges[plan.id];
          const qty = override?.quantity ?? plan.quantity;
          return qty === 0;
        });
      if (hasZeroQuantityPlan) return;

      // 같은 quotation_product의 총 생산수량 계산 (현재 변경된 수량 및 formChanges 반영)
      const totalQuantity = projectPlans
        .filter(
          (plan) =>
            plan.quotation_product.id === currentPlan.quotation_product.id
        ) // 같은 quotation_product의 모든 plan 찾기
        .reduce((sum, plan) => {
          // 현재 수정 중인 plan이면 새로운 수량으로(사용자가 변경한 수량) 사용
          if (plan.id === planId) {
            return sum + formData.quantity;
          }
          // 다른 plan도 formChanges에 변경사항이 있으면 그 값 사용
          const planFormData = formChanges[plan.id];
          const quantity = planFormData?.quantity ?? plan.quantity;
          return sum + quantity;
        }, 0);

      // 주문수량 (현재 plan에서 바로 가져오기)
      const orderQuantity = currentPlan.quotation_product.quantity;

      // 총 생산수량이 주문수량보다 작으면 자동으로 새 plan 추가
      if (totalQuantity < orderQuantity) {
        // buffer_rate가 null/undefined면 0.1을 기본으로 적용
        const bufferRate =
          currentPlan.quotation_product.product?.buffer_rate ?? 0.1;
        // 부동소수점 올림 오차 방지: 목표 = 주문수량 + ceil(주문수량 * buffer)
        const targetTotalQuantity =
          orderQuantity + Math.ceil(orderQuantity * bufferRate);
        // 자동 생성 수량 = 목표 총 생산량 - 현재까지의 총 생산수량
        const autoQuantity = Math.max(0, targetTotalQuantity - totalQuantity);

        // 자동 생성될 plan의 기본 설비 (현재 plan과 동일한 설비 사용)
        const defaultEquipmentId =
          allEquipments.length > 0
            ? allEquipments[0].id
            : currentPlan.equipment.id;

        // 기본 일정 (현재 plan과 동일한 일정 사용)
        const defaultStartDate = currentPlan.start_date
          ? new Date(currentPlan.start_date)
              .toISOString()
              .slice(0, 16)
              .replace('T', ' ')
          : '';
        const defaultEndDate = currentPlan.end_date
          ? new Date(currentPlan.end_date)
              .toISOString()
              .slice(0, 16)
              .replace('T', ' ')
          : '';

        // 새 plan 데이터
        const newPlanData: ProductionPlanFormDataModel = {
          quantity: autoQuantity,
          equipment_id: defaultEquipmentId,
          start_date: defaultStartDate,
          end_date: defaultEndDate,
        };

        // 같은 quotation_product의 마지막 plan을 찾아서 그 다음에 추가
        const sameProductPlans = projectPlans.filter(
          (plan) =>
            plan.quotation_product.id === currentPlan.quotation_product.id
        );
        const lastPlanOfSameProduct =
          sameProductPlans[sameProductPlans.length - 1];
        const targetParentId = lastPlanOfSameProduct?.id || planId;

        // 자동으로 새 plan 추가
        handleAddPlan(newPlanData, targetParentId);
      }
    },
    [projectPlans, formChanges, allEquipments, handleAddPlan]
  );

  // 생산수량 변경 감지를 위한 디바운스 콜백
  const debouncedQuantityCheck = useDebouncedCallback(
    checkQuantityAndCreatePlan,
    1000, // 1000ms 디바운스 (타이핑 완료 후 체크)
    {
      leading: false,
      trailing: true, // 마지막 호출 후에만 실행
    }
  );

  // 폼 변경 핸들러 (저장 버튼 클릭 시에만 저장)
  const handleFormChange = useCallback(
    (planId: number, formData: ProductionPlanFormDataModel) => {
      // 즉시 formChanges 상태 업데이트 (타이핑 반응성 유지)
      setFormChanges((prev) => ({
        ...prev,
        [planId]: formData,
      }));

      // 생산수량 변경 시에만 디바운스 체크 (새 plan 생성 판단)
      const currentPlan = projectPlans.find((p) => p.id === planId);
      if (currentPlan && formData.quantity !== currentPlan.quantity) {
        debouncedQuantityCheck(planId, formData);
      }
    },
    [projectPlans, debouncedQuantityCheck]
  );

  // 개별 생산 계획 저장 함수 (저장 버튼 클릭 시)
  const handleFormSave = useCallback(
    async (planId: number, formData: ProductionPlanFormDataModel) => {
      try {
        // 날짜 유효성 검사
        const isDateValid = checkDateValidity(formData);
        if (!isDateValid) {
          showDateToast();
          return;
        }

        // 시간대 충돌 검사
        const hasTimeConflict = checkTimeConflicts(planId, formData);
        if (hasTimeConflict) {
          showTimeToast();
          return;
        }

        // 설비 중복 검사
        const hasEquipmentConflict = checkEquipmentConflicts(planId, formData);
        if (hasEquipmentConflict) {
          showEquipmentToast();
          return;
        }

        if (projectId === null) return;

        const currentPlan = projectPlans.find((p) => p.id === planId);
        if (!currentPlan) return; // plan을 찾을 수 없으면 종료

        const isNewPlan = planId < 0;
        const result = await createOrUpdateProjectPlan({
          project_id: projectId,
          quotation_product_id: currentPlan.quotation_product.id,
          equipment_id: formData.equipment_id,
          quantity: formData.quantity,
          start_date: formData.start_date,
          end_date: formData.end_date,
          avg_production_time: currentPlan.avg_production_time,
          plan_id: isNewPlan ? undefined : planId,
          total_amount: currentPlan.quotation_product.quantity,
          total_quantity: projectPlans
            .filter(
              (plan) =>
                plan.quotation_product.id === currentPlan.quotation_product.id
            )
            .reduce((sum, plan) => {
              if (plan.id === planId) {
                return sum + formData.quantity;
              }
              const planFormData = formChanges[plan.id];
              const quantity = planFormData?.quantity ?? plan.quantity;
              return sum + quantity;
            }, 0),
        });

        if (result.success) {
          // 저장 성공 시 projectPlans 상태 업데이트 (저장된 값으로)
          setProjectPlans((prev) => {
            const realId = result.data?.plan_id;
            return prev.map((plan) => {
              if (plan.id !== planId) return plan;
              const updated = {
                ...plan,
                id: isNewPlan && realId ? realId : plan.id,
                quantity: formData.quantity,
                equipment: {
                  ...plan.equipment,
                  id: formData.equipment_id,
                  name:
                    allEquipments.find((eq) => eq.id === formData.equipment_id)
                      ?.name || plan.equipment.name,
                },
                start_date: formData.start_date,
                end_date: formData.end_date,
              } as ProjectPlanModel;
              // 새 플랜이 저장되면 is_new 제거
              if (isNewPlan) {
                (updated as unknown as { is_new?: boolean }).is_new = undefined;
              }
              return updated;
            });
          });

          // 저장 성공 시 해당 plan의 formChanges 초기화
          setFormChanges((prev) => {
            const newChanges: Record<number, ProductionPlanFormDataModel> = {
              ...prev,
            };
            const realId = result.data?.plan_id;
            if (isNewPlan && realId) {
              // 키를 임시ID에서 실제ID로 이전
              const saved = newChanges[planId];
              delete newChanges[planId];
              newChanges[realId] = saved;
            } else {
              delete newChanges[planId];
            }
            return newChanges;
          });

          showSaveToast();
        }
      } catch {
        alert('저장에 실패했습니다.');
      }
    },
    [
      createOrUpdateProjectPlan,
      projectId,
      showTimeToast,
      showEquipmentToast,
      showDateToast,
      showSaveToast,
      projectPlans,
      formChanges,
      checkTimeConflicts,
      checkEquipmentConflicts,
      allEquipments,
    ]
  );

  // 변경된 모든 생산 계획들을 한 번에 저장하는 함수
  const saveProjectPlans = async () => {
    try {
      if (projectId === null) {
        return { success: false };
      }
      // 저장 전에 충돌 검사
      for (const [planId, formData] of Object.entries(formChanges)) {
        // 날짜 유효성 검사
        const isDateValid = checkDateValidity(formData);
        if (!isDateValid) {
          showDateToast();
          return { success: false, error: '날짜 형식 오류' };
        }

        // 시간대 충돌 검사
        const hasTimeConflict = checkTimeConflicts(parseInt(planId), formData);
        if (hasTimeConflict) {
          showTimeToast();
          return { success: false, error: '시간대 충돌' };
        }

        // 설비 중복 검사
        const hasEquipmentConflict = checkEquipmentConflicts(
          parseInt(planId),
          formData
        );
        if (hasEquipmentConflict) {
          showEquipmentToast();
          return { success: false, error: '설비 중복' };
        }
      }

      const updatePromises = Object.entries(formChanges).map(
        ([planId, formData]) => {
          const currentPlan = projectPlans.find(
            (p) => p.id === parseInt(planId)
          );
          if (!currentPlan) return Promise.resolve({ success: true }); // plan을 찾을 수 없으면 건너뛰기

          return createOrUpdateProjectPlan({
            project_id: projectId,
            quotation_product_id: currentPlan.quotation_product.id,
            equipment_id: formData.equipment_id,
            quantity: formData.quantity,
            start_date: formData.start_date,
            end_date: formData.end_date,
            avg_production_time: currentPlan.avg_production_time,
            plan_id: parseInt(planId), // 모든 plan이 이제 DB에 저장되므로 항상 planId 사용
            total_amount: currentPlan.quotation_product.quantity,
            total_quantity: projectPlans
              .filter(
                (plan) =>
                  plan.quotation_product.id === currentPlan.quotation_product.id
              )
              .reduce((sum, plan) => {
                if (plan.id === parseInt(planId)) {
                  return sum + formData.quantity;
                }
                // 다른 plan도 formChanges에 변경사항이 있으면 그 값 사용
                const planFormData = formChanges[plan.id];
                const quantity = planFormData?.quantity ?? plan.quantity;
                return sum + quantity;
              }, 0),
          });
        }
      );

      await Promise.all(updatePromises);

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
        // 현재 상태에 따라 다음 상태로 변경
        if (projectStatus === 'pending') {
          await handleChangeStatus('production');
        } else if (projectStatus === 'production') {
          await handleChangeStatus('manufactured');
        }
      }
      return { success: true };
    } catch {
      alert('프로젝트 상태 변경 중 오류가 발생했습니다.');
      return { success: false };
    }
  };

  const handleProductionPlanSave = async () => {
    // 다음 버튼 누르면 // 변경된 생산 계획들을 한 번에 저장
    setIsSaveLoading(true);
    try {
      // 1. 생산 계획 저장
      const saveResult = await saveProjectPlans();
      if (!saveResult.success) {
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
    } finally {
      setIsSaveLoading(false);
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
          {projectPlans.map((item, index) => {
            // 같은 quotation_product의 첫 번째 plan인지 판단
            const isFirstOfProduct =
              index === 0 ||
              projectPlans[index - 1].quotation_product.id !==
                item.quotation_product.id;

            return (
              <TableItem
                key={item.id}
                item={item}
                onOperationStatusClick={
                  projectStatus === 'pending'
                    ? undefined
                    : (e) => handleOperationStatusClick(e, item.id)
                }
                onFacilityClick={(e) => handleFacilityClick(e, item.id)}
                onFormChange={handleFormChange}
                onSave={handleFormSave} // 저장 함수 추가
                onDelete={handleDeletePlan} // 삭제 함수 추가
                formData={formChanges[item.id]}
                equipments={allEquipments}
                projectStatus={projectStatus}
                isFirstOfProduct={isFirstOfProduct}
              />
            );
          })}
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
              left: operationStatusAnchorRect.left - 9.6,
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
            equipments={allEquipments}
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
          isLoading={isSaveLoading}
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

      {/* 생산 계획 삭제 토스트 */}
      {isDeleteToastOpen && (
        <Toast
          text="생산 계획을 삭제할 수 없어요."
          subtext="생산 수량이 부족해요. 수량을 늘려야 삭제할 수 있어요."
          icon={<WarningCircle size={20} className="text-red" />}
          type="red"
          isVisible={isDeleteToastVisible}
        />
      )}
      {/* 생산 계획 저장 토스트 */}
      {isSaveToastOpen && (
        <Toast
          text="생산 계획이 저장되었어요."
          subtext="변경된 내용이 반영되었어요."
          icon={<CheckCircle size={20} className="text-primary" />}
          type="primary"
          isVisible={isSaveToastVisible}
        />
      )}
      {/* 유효한 날짜로 입력 토스트 */}
      {isDateToastOpen && (
        <Toast
          text="유효한 일자를 입력해 주세요."
          subtext="생산일자와 마감 예정일자를 확인해 주세요."
          icon={<WarningCircle size={20} className="text-red" />}
          type="red"
          isVisible={isDateToastVisible}
        />
      )}
    </>
  );
};

export default ProductionPlan;
