import { useState, useMemo, useEffect } from 'react';
import Input from '@/ui/input';
import { handleQuantityInput } from '@/utils/format-number';

interface DefectRateProps {
  onError?: (text: string, subtext: string) => void;
  initialDefectQuantity?: number;
  onDefectQuantityChange?: (defectQuantity: number) => void;
  totalProductionQuantity?: number; // 생산 지시 수량
  onTotalProductionQuantityChange?: (quantity: number) => void; // 총 생산 수량 변경 시 생산 지시 수량 업데이트
}

export const DefectRate = ({
  onError,
  initialDefectQuantity = 0,
  onDefectQuantityChange,
  totalProductionQuantity = 0,
  onTotalProductionQuantityChange,
}: DefectRateProps) => {
  const [totalProduction, setTotalProduction] = useState<string>(() => {
    if (totalProductionQuantity > 0) {
      const result = handleQuantityInput(totalProductionQuantity.toString());
      return result.displayValue;
    }
    return '';
  });
  const [defectQuantity, setDefectQuantity] = useState<string>(() => {
    if (initialDefectQuantity > 0) {
      // handleQuantityInput을 사용하여 일관된 포맷팅 적용
      const result = handleQuantityInput(initialDefectQuantity.toString());
      return result.displayValue;
    }
    return '';
  });

  // 생산 지시 수량이 변경되면 총 생산 수량에 자동 반영
  // 단, 사용자가 직접 총 생산 수량을 수정한 경우는 제외
  const [isUserEditingTotalProduction, setIsUserEditingTotalProduction] =
    useState(false);

  useEffect(() => {
    // 사용자가 직접 수정 중이 아닐 때만 자동 동기화
    if (!isUserEditingTotalProduction) {
      if (totalProductionQuantity > 0) {
        const result = handleQuantityInput(totalProductionQuantity.toString());
        setTotalProduction(result.displayValue);
      } else {
        setTotalProduction('');
      }
    }
  }, [totalProductionQuantity, isUserEditingTotalProduction]);

  // 총 생산 수량의 숫자 값
  const totalProductionNumeric = useMemo(() => {
    return handleQuantityInput(totalProduction).numericValue;
  }, [totalProduction]);

  // 불량 수량의 숫자 값
  const defectQuantityNumeric = useMemo(() => {
    return handleQuantityInput(defectQuantity).numericValue;
  }, [defectQuantity]);

  // 불량 수량이 변경될 때 부모 컴포넌트에 알림
  useEffect(() => {
    onDefectQuantityChange?.(defectQuantityNumeric);
  }, [defectQuantityNumeric, onDefectQuantityChange]);

  // 양품 수량 계산: 총 생산 수량 - 불량 수량
  const goodQuantity = useMemo(() => {
    // 둘 다 입력되어야 계산 결과 표시
    if (!totalProduction || !defectQuantity) return '-';

    const good = totalProductionNumeric - defectQuantityNumeric;
    if (good <= 0) return '0';
    return good.toLocaleString('en-US');
  }, [
    totalProduction,
    defectQuantity,
    totalProductionNumeric,
    defectQuantityNumeric,
  ]);

  // 불량률 계산: (불량 수량 / 총 생산 수량) * 100
  const defectRate = useMemo(() => {
    // 둘 다 입력되어야 계산 결과 표시
    if (!totalProduction || !defectQuantity) return '-';

    if (totalProductionNumeric === 0) return '0';
    const rate = (defectQuantityNumeric / totalProductionNumeric) * 100;
    return rate.toFixed(2);
  }, [
    totalProduction,
    defectQuantity,
    totalProductionNumeric,
    defectQuantityNumeric,
  ]);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 flex items-center">불량률 정보</h3>

      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Input
            label="총 생산 수량"
            type="text"
            value={totalProduction}
            onChange={(e) => {
              setIsUserEditingTotalProduction(true);
              const result = handleQuantityInput(e.target.value);
              setTotalProduction(result.displayValue);
              // 총 생산 수량이 변경되면 생산 지시 수량도 업데이트
              onTotalProductionQuantityChange?.(result.numericValue);
            }}
            onBlur={() => {
              setIsUserEditingTotalProduction(false);
            }}
            placeholder="생산 수량을 입력하세요."
          />
          <Input
            label="불량 수량"
            type="text"
            value={defectQuantity}
            onChange={(e) => {
              const result = handleQuantityInput(e.target.value);
              const newDefectNumeric = result.numericValue;

              // 총 생산 수량이 있고, 불량 수량이 생산 수량보다 큰 경우
              if (
                totalProduction &&
                newDefectNumeric > totalProductionNumeric
              ) {
                setDefectQuantity('');
                onError?.(
                  '불량 수량을 확인해 주세요.',
                  '불량 수량은 총 생산 수량보다 작아야 합니다'
                );
                return;
              }

              setDefectQuantity(result.displayValue);
            }}
            placeholder="불량 수량을 입력하세요."
          />
        </div>
        <div className="flex gap-2">
          <Input
            label="양품 수량"
            type="text"
            value={goodQuantity}
            disabledReadOnly
          />
          <Input
            label="불량률(%)"
            type="text"
            value={defectRate}
            disabledReadOnly
          />
        </div>
      </div>
    </div>
  );
};
