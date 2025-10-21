import { useState, useMemo } from 'react';
import Input from '@/ui/input';
import { handleQuantityInput } from '@/utils/format-number';

export const DefectRate = () => {
  const [totalProduction, setTotalProduction] = useState<string>('');
  const [defectQuantity, setDefectQuantity] = useState<string>('');

  // 총 생산 수량의 숫자 값
  const totalProductionNumeric = useMemo(() => {
    return handleQuantityInput(totalProduction).numericValue;
  }, [totalProduction]);

  // 불량 수량의 숫자 값
  const defectQuantityNumeric = useMemo(() => {
    return handleQuantityInput(defectQuantity).numericValue;
  }, [defectQuantity]);

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
              const result = handleQuantityInput(e.target.value);
              setTotalProduction(result.displayValue);
            }}
            placeholder="생산 수량을 입력하세요."
          />
          <Input
            label="불량 수량"
            type="text"
            value={defectQuantity}
            onChange={(e) => {
              const result = handleQuantityInput(e.target.value);
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
