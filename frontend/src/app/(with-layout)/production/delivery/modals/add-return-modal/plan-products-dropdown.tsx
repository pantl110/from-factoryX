import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';
import React, { useEffect, useState } from 'react';
import { useGetProjectPlans } from '@/hooks';
import { ProjectPlanModel } from '@/types/data-model';

interface PlanProductsDropdownProps {
  projectId: number;
  onClose: () => void;
  onSelect: (product: { id: number; name: string }) => void;
}

const PlanProductsDropdown = ({
  projectId,
  onClose,
  onSelect,
}: PlanProductsDropdownProps) => {
  const [projectPlans, setProjectPlans] = useState<ProjectPlanModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { getProjectPlans } = useGetProjectPlans();

  useEffect(() => {
    const fetchProjectPlans = async () => {
      if (!projectId) return;

      setIsLoading(true);
      const result = await getProjectPlans(projectId);
      if (result.success && result.data) {
        setProjectPlans(result.data);
      }
      setIsLoading(false);
    };

    fetchProjectPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // 프로젝트 계획에서 품목 추출 및 중복 제거
  const productMap = new Map<number, { id: number; name: string }>();

  projectPlans.forEach((plan) => {
    const { product } = plan.quotation_product;
    if (!productMap.has(product.id)) {
      productMap.set(product.id, {
        id: product.id,
        name: product.name,
      });
    }
  });

  const products = Array.from(productMap.values());

  // DropdownItem 높이: h-12 (48px), 4개 항목 = 192px + padding
  const maxHeight = 'max-h-[200px]';

  if (isLoading) {
    return (
      <Dropdown onClose={onClose} width="w-full" maxHeight={maxHeight}>
        <DropdownItem text="..." onClick={() => {}} />
      </Dropdown>
    );
  }

  if (products.length === 0) {
    return (
      <Dropdown onClose={onClose} width="w-full" maxHeight={maxHeight}>
        <DropdownItem text="품목이 없습니다." onClick={() => {}} />
      </Dropdown>
    );
  }

  return (
    <Dropdown onClose={onClose} width="w-full" maxHeight={maxHeight}>
      {products.map((product) => (
        <DropdownItem
          key={product.id}
          text={product.name}
          onClick={() => onSelect(product)}
        />
      ))}
    </Dropdown>
  );
};

export default PlanProductsDropdown;
