import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';
import { EquipmentResponseModel } from '@/types/data-model';
import { useState, useEffect, useCallback } from 'react';
import useMemberStore from '@/store/member-store';

interface FacilityDropdownProps {
  onClose: () => void;
  style?: React.CSSProperties;
  onSelect: (equipment: EquipmentResponseModel) => void;
}

const FacilityDropdown = ({
  onClose,
  style,
  onSelect,
}: FacilityDropdownProps) => {
  const [equipments, setEquipments] = useState<EquipmentResponseModel[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const factoryId = useMemberStore((state) => state.factoryId);

  // 초기 데이터 로드
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!factoryId) return;

      setIsLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/equipment?factory_id=${factoryId}&page=1&page_size=5`,
          {
            method: 'GET',
            credentials: 'include',
          }
        );

        if (response.ok) {
          const result = await response.json();
          const newEquipments = result?.data || [];
          const nextPage = result?.nextPage;

          setEquipments(newEquipments);
          setCurrentPage(1);
          setHasMore(!!nextPage);
        }
      } catch (error) {
        console.error('Failed to fetch equipments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [factoryId]);

  // 더 많은 설비 로드
  const loadMoreEquipments = useCallback(async () => {
    if (isLoading || !hasMore || !factoryId) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/equipment?factory_id=${factoryId}&page=${currentPage + 1}&page_size=5`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (response.ok) {
        const result = await response.json();
        const newEquipments = result?.data || [];
        const nextPage = result?.nextPage;

        setEquipments((prev) => [...prev, ...newEquipments]);
        setCurrentPage((prev) => prev + 1);
        setHasMore(!!nextPage);
      }
    } catch (error) {
      console.error('Failed to load more equipments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, factoryId, currentPage]);

  const handleSelectEquipment = (equipment: EquipmentResponseModel) => {
    onSelect(equipment);
    onClose();
  };

  // 데이터가 없으면 드롭다운 표시 안 함
  if (equipments.length === 0) {
    return null;
  }

  return (
    <div style={{ ...style, minWidth: style?.width }} className="w-fit">
      <Dropdown
        onClose={onClose}
        width="w-full"
        maxHeight="max-h-[180px]"
        onLoadMore={loadMoreEquipments}
        hasMore={hasMore}
        isLoading={isLoading}
      >
        {equipments.map((equipment, index) => (
          <DropdownItem
            key={`${equipment.id}-${index}`}
            text={`${equipment.name}`}
            onClick={() => handleSelectEquipment(equipment)}
            breakWords={true}
          />
        ))}
      </Dropdown>
    </div>
  );
};

export default FacilityDropdown;
