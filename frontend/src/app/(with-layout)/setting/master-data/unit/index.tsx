import SearchSection from './search-section';
import NoHistoryBox from '@/ui/no-history-box';
import { UnitTableHeader } from './unit-table-header';
import { UnitTableItem } from './unit-table-item';
import { UnitConversionModel } from '@/types/data-model';
import Pagination from '@/components/pagination';
import Spinner from '@/ui/spinner';

interface UnitProps {
  unitList: UnitConversionModel[];
  refetchUnit: () => Promise<void>;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  searchKeyword: string;
  onSearchChange: (value: string) => void;
  onSearchEnter: () => void;
  isLoading?: boolean;
}
const Unit = ({
  unitList,
  refetchUnit,
  currentPage,
  totalPages,
  onPageChange,
  searchKeyword,
  onSearchChange,
  onSearchEnter,
  isLoading = false,
}: UnitProps) => {
  return (
    <>
      <div className="w-full px-10 pb-10">
        <SearchSection
          value={searchKeyword}
          onChange={onSearchChange}
          onEnter={onSearchEnter}
        />
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner />
          </div>
        ) : unitList.length === 0 ? (
          <NoHistoryBox
            title="단위가 아직 없어요."
            text="단위를 추가하면 이곳에 표시돼요."
          />
        ) : (
          <>
            <UnitTableHeader />
            {unitList.map((item: UnitConversionModel) => (
              <UnitTableItem
                key={item.id}
                unit={item}
                refetchUnit={refetchUnit}
              />
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
