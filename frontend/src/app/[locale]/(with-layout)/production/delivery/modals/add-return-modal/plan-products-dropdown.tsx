import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';
import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useProjectPlansQuery } from '@/hooks';

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
  const tProduction = useTranslations('production.returnModal');
  const { data: projectPlans = [], isLoading } =
    useProjectPlansQuery(projectId);

  // 프로젝트 계획에서 품목 추출 및 중복 제거
  const products = useMemo(() => {
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

    return Array.from(productMap.values());
  }, [projectPlans]);

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
        <DropdownItem text={tProduction('noItems')} onClick={() => {}} />
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
