import { useEffect } from 'react';
import { ProjectPlanModel } from '@/types/data-model';
import usePageStatusStore from '@/store/page-status-store';

interface ProductionPlanFormData {
  quantity: number;
  equipment_id: number;
  start_date: string;
  end_date: string;
}

export const useProductionPlanValidation = (
  projectPlans: ProjectPlanModel[],
  formChanges: Record<number, ProductionPlanFormData>
) => {
  const setProductionPlanValid = usePageStatusStore(
    (state) => state.setProductionPlanValid
  );

  // 모든 필수 필드가 입력되었는지 검증
  const validateAllFields = (): boolean => {
    return projectPlans.every((plan) => {
      const formData = formChanges[plan.id];
      const currentData = formData || {
        quantity: plan.quantity,
        equipment_id: plan.equipment.id,
        start_date: plan.start_date,
        end_date: plan.end_date,
      };
      
      return (
        currentData.quantity > 0 &&
        currentData.equipment_id > 0 &&
        currentData.start_date?.trim() &&
        currentData.end_date?.trim()
      );
    });
  };

  // 데이터 변경 시마다 검증 상태 업데이트
  useEffect(() => {
    const isValid = validateAllFields();
    setProductionPlanValid(isValid);
  }, [projectPlans, formChanges, setProductionPlanValid]);

  return {
    validateAllFields,
    isValid: validateAllFields(),
  };
}; 