import SearchSection from './search-section';
import NoHistoryBox from '@/ui/no-history-box';
import { UnitTableHeader } from './unit-table-header';
import { UnitTableItem } from './unit-table-item';
import { UnitConversionModel } from '@/types/data-model';
import Pagination from '@/components/pagination';

interface UnitProps {
  unitList: UnitConversionModel[];
  refetchUnit: () => Promise<void>;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
const Unit = ({
  unitList,
  refetchUnit,
  currentPage,
  totalPages,
  onPageChange,
}: UnitProps) => {
  return (
    <>
      <div className="w-full px-10 pb-10">
        <SearchSection />
        {unitList.length === 0 ? (
          <NoHistoryBox
            title="단위가 아직 없어요."
            text="단위를 추가하면 이곳에 표시돼요."
          />
        ) : (
          <>
            <UnitTableHeader />
            {unitList.map((item: UnitConversionModel) => (
              <UnitTableItem key={item.id} unit={item} />
            ))}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Unit;
