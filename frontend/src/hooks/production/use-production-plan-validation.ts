import { useEffect, useMemo } from 'react';
import { ProjectPlanModel } from '@/types/data-model';
import usePageStatusStore from '@/store/page-status-store';

interface ProductionPlanFormDataModel {
  quantity: number;
  equipment_id: number;
  start_date: string;
  end_date: string;
}

export const useProductionPlanValidation = (
  projectPlans: ProjectPlanModel[],
  formChanges: Record<number, ProductionPlanFormDataModel>
) => {
  const setProductionPlanValid = usePageStatusStore(
    (state) => state.setProductionPlanValid
  );

  // 검증 결과를 useMemo로 메모이제이션
  const isValid = useMemo(() => {
    const isValidResult = projectPlans.every((plan) => {
      const formData = formChanges[plan.id];
      const currentData = formData || {
        quantity: plan.quantity,
        equipment_id: plan.equipment.id,
        start_date: plan.start_date,
        end_date: plan.end_date,
      };

      const isItemValid =
        currentData.quantity > 0 &&
        currentData.equipment_id > 0 &&
        currentData.start_date?.trim() !== '' &&
        currentData.end_date?.trim() !== '' &&
        currentData.start_date?.length >= 10 && // YYYY-MM-DD 형식 최소 길이
        currentData.end_date?.length >= 10;

      return isItemValid;
    });

    return isValidResult;
  }, [projectPlans, formChanges]);

  // 검증 상태 업데이트
  useEffect(() => {
    setProductionPlanValid(isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid]);

  return {
    isValid,
  };
};
