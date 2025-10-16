import SearchSection from './search-section';
import { mockUnitConversionData } from './mockData';
import NoHistoryBox from '@/ui/no-history-box';
import { UnitTableHeader } from './unit-table-header';
import { UnitTableItem } from './unit-table-item';

const Unit = () => {
  const unitList = mockUnitConversionData;

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
            {unitList.map((item) => (
              <UnitTableItem key={item.id} unit={item} />
            ))}

            {/* 페이지네이션 */}
            {/* {totalPages >= 2 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange || (() => {})}
              />
            )} */}
          </>
        )}
      </div>
    </>
  );
};

export default Unit;
