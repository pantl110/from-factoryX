import Panel from '@/ui/panel';
import MiniBtn from '@/ui/mini-btn';
import { ProductionInfo } from './production-info';
import { DefectRate } from './defect-rate';
import { LossRate } from './loss-rate';
import { ProjectPlanModel } from '@/types/data-model';
import { useRef, useState, useCallback, useMemo } from 'react';
import {
  useCreateOrUpdateProjectPlan,
  checkDateValidity,
  useToast,
} from '@/hooks';
import Toast from '@/ui/toast';
import { WarningCircle } from '@phosphor-icons/react';
import axios from 'axios';

interface ProductionResultPanelProps {
  onClose: () => void;
  plan: ProjectPlanModel;
  onSaveSuccess?: () => void;
}

export const ProductionResultPanel = ({
  onClose,
  plan,
  onSaveSuccess,
}: ProductionResultPanelProps) => {
  const { createOrUpdateProjectPlan } = useCreateOrUpdateProjectPlan();
  const { isToastOpen, isVisible, showToast } = useToast();

  // 토스트 메시지 상태
  const [toastTexts, setToastTexts] = useState<{
    text: string;
    subtext: string;
  }>({
    text: '',
    subtext: '',
  });
  // 생산 상세 정보 폼 데이터
  const [currentFormData, setCurrentFormData] = useState<{
    quantity: number;
    start_date: string;
    end_date: string;
  }>({
    quantity: plan.quantity ?? plan.quotation_product.quantity ?? 0,
    start_date: plan.start_date ?? '',
    end_date: plan.end_date ?? '',
  });
  // 불량 수량 상태
  const [defectiveQuantity, setDefectiveQuantity] = useState<number>(
    plan.defective_quantity ?? 0
  );

  // isDirty 상태 관리 (ProductionInfo의 react-hook-form isDirty + DefectRate 변경사항)
  const [isProductionInfoDirty, setIsProductionInfoDirty] = useState(false);

  const materialUsageSaveRef = useRef<(() => Promise<void>) | null>(null);

  const handleFormChange = useCallback(
    (data: { quantity: number; start_date: string; end_date: string }) => {
      setCurrentFormData(data);
    },
    []
  );

  const handleDefectRateError = useCallback(
    (text: string, subtext: string) => {
      setToastTexts({
        text,
        subtext,
      });
      showToast();
    },
    [showToast]
  );

  const handleDefectQuantityChange = useCallback((defectQuantity: number) => {
    setDefectiveQuantity(defectQuantity);
  }, []);

  // ProductionInfo의 react-hook-form isDirty 상태 변경 핸들러
  const handleProductionInfoDirtyChange = useCallback((dirty: boolean) => {
    setIsProductionInfoDirty(dirty);
  }, []);

  // 전체 isDirty 상태 계산 (ProductionInfo의 react-hook-form isDirty 또는 DefectRate 변경 시)
  const isDirty = useMemo(() => {
    const initialDefectQuantity = plan.defective_quantity ?? 0;
    const isDefectRateDirty = defectiveQuantity !== initialDefectQuantity;
    return isProductionInfoDirty || isDefectRateDirty;
  }, [isProductionInfoDirty, defectiveQuantity, plan.defective_quantity]);

  const handleTotalProductionQuantityChange = useCallback(
    (quantity: number) => {
      setCurrentFormData((prev) => ({
        ...prev,
        quantity,
      }));
    },
    []
  );

  const handleSave = useCallback(async () => {
    // 날짜 유효성 검사
    const isDateValid = checkDateValidity({
      start_date: currentFormData.start_date,
      end_date: currentFormData.end_date,
    });
    if (!isDateValid) {
      setToastTexts({
        text: '유효한 생산 시작일자나 생산 완료일자를 입력해 주세요.',
        subtext: 'YYYY-MM-DD 00:00 형식으로 입력해주세요.',
      });
      setCurrentFormData({
        quantity: plan.quantity ?? plan.quotation_product.quantity ?? 0,
        start_date: plan.start_date ?? '',
        end_date: plan.end_date ?? '',
      });
      showToast();
      return;
    }

    // 수량 검사
    if (currentFormData.quantity <= 0) {
      setToastTexts({
        text: '생산 수량을 입력해주세요.',
        subtext: '',
      });
      setCurrentFormData({
        quantity: plan.quantity ?? plan.quotation_product.quantity ?? 0,
        start_date: plan.start_date ?? '',
        end_date: plan.end_date ?? '',
      });
      showToast();
      return;
    }

    try {
      const result = await createOrUpdateProjectPlan({
        project_id: plan.project_id,
        quotation_product_id: plan.quotation_product.id,
        equipment_id: plan.equipment.id,
        quantity: currentFormData.quantity,
        start_date: currentFormData.start_date,
        end_date: currentFormData.end_date,
        defective_quantity: defectiveQuantity,
        avg_production_time: plan.avg_production_time,
        plan_id: plan.id > 0 ? plan.id : undefined,
      });

      if (result.success) {
        // 생산 계획 저장 성공 시 자재 사용 정보도 함께 저장
        if (materialUsageSaveRef.current) {
          try {
            await materialUsageSaveRef.current();
          } catch (error: unknown) {
            // 에러 메시지 파싱
            const errorMessage = axios.isAxiosError(error)
              ? error.response?.data?.detail || error.message || ''
              : error instanceof Error
                ? error.message
                : String(error);

            // material_history_id 또는 material_repackaging_id 관련 오류
            if (
              errorMessage.includes('material_history_id') ||
              errorMessage.includes('material_repackaging_id')
            ) {
              setToastTexts({
                text: 'LOT 번호를 선택해주세요.',
                subtext: '',
              });
              showToast();
              return;
            }

            // 사용량 0 관련 오류
            if (errorMessage.includes('사용량은 0보다 커야 합니다.')) {
              setToastTexts({
                text: '실제 투입량을 입력해 주세요.',
                subtext: '',
              });
              showToast();
              return;
            }

            // 기타 오류
            setToastTexts({
              text: '자재 사용 정보 저장에 실패했습니다.',
              subtext: errorMessage,
            });
            showToast();
            return;
          }
        }
        // 저장 성공 후 isDirty 상태 초기화
        setIsProductionInfoDirty(false);
        onSaveSuccess?.();
        onClose();
      } else {
        setToastTexts({
          text: '저장에 실패했습니다.',
          subtext: '',
        });
        showToast();
      }
    } catch (error: unknown) {
      // 생산 계획 저장 오류
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.detail || error.message || ''
        : error instanceof Error
          ? error.message
          : String(error);

      setToastTexts({
        text: '저장 중 오류가 발생했습니다.',
        subtext: errorMessage,
      });
      showToast();
    }
  }, [
    currentFormData,
    defectiveQuantity,
    plan,
    createOrUpdateProjectPlan,
    onClose,
    onSaveSuccess,
    showToast,
  ]);

  return (
    <>
      <Panel
        title="생산 결과 입력"
        onClose={onClose}
        headerButton={
          isDirty ? (
            <MiniBtn text="저장" variant="secondary" onClick={handleSave} />
          ) : null
        }
      >
        <div className="flex flex-col gap-10">
          {/* 생산 상세 정보 */}
          <ProductionInfo
            plan={plan}
            onFormChange={handleFormChange}
            onIsDirtyChange={handleProductionInfoDirtyChange}
          />

          {/* 불량률 정보 */}
          <DefectRate
            onError={handleDefectRateError}
            initialDefectQuantity={plan.defective_quantity ?? 0}
            onDefectQuantityChange={handleDefectQuantityChange}
            totalProductionQuantity={currentFormData.quantity}
            onTotalProductionQuantityChange={
              handleTotalProductionQuantityChange
            }
          />

          {/* 자재 소모/로스율 정보 */}
          <LossRate
            productId={plan.quotation_product.product.id}
            productionQuantity={currentFormData.quantity}
            planId={plan.id}
            onRegisterSaveAllMaterialUsage={(fn) => {
              materialUsageSaveRef.current = fn;
            }}
          />
        </div>
      </Panel>
      {isToastOpen && (
        <Toast
          text={toastTexts.text}
          subtext={toastTexts.subtext}
          icon={<WarningCircle size={20} className="text-red" />}
          type="red"
          isVisible={isVisible}
        />
      )}
    </>
  );
};
