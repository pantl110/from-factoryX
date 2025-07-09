"use client";

import { useState, Suspense } from "react";
import { useEffect } from "react";
import MainTitleSec from "./main-title-sec";
import TableHeader from "../table-header";
import TableItem from "../table-item";
import TaxDetailPanel from "../tax-detail-panel";
import { taxData, TaxDataModel } from "@/mocks/tax-data";
import { TaxDocumentType } from "@/types/status-type";
import Spinner from "@/ui/spinner";
import { useCheckAll } from "@/hooks/use-check-all";
import SearchInput from "@/ui/search-input";
import MiniBtn from "@/ui/mini-btn";
import usePagination from "@/hooks/use-pagination";
import Pagination from "@/components/pagination";
import EmptySpace from "@/ui/empty-space";

const TaxPageContent = () => {
  const [selectedTaxType, setSelectedTaxType] = useState<
    TaxDocumentType | "전체"
  >("전체");
  const [selectedItem, setSelectedItem] = useState<TaxDataModel | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showHidden, setShowHidden] = useState(false);

  const handleOpenPanel = (item: TaxDataModel) => {
    setSelectedItem(item);
    setIsPanelOpen(true);
  };
  const handleClosePanel = () => {
    setSelectedItem(null);
    setIsPanelOpen(false);
  };

  const handleSortClick = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const filteredData =
    selectedTaxType === "전체"
      ? taxData
      : taxData.filter((item) => item.taxType === selectedTaxType);

  const hiddenFilteredData = filteredData.filter(
    (item) => item.isHidden === showHidden,
  );

  const sortedData = [...hiddenFilteredData].sort((a, b) => {
    if (sortDirection === "asc") {
      return a.date.localeCompare(b.date);
    } else {
      return b.date.localeCompare(a.date);
    }
  });

  const {
    currentItems: pagedData,
    currentPage,
    totalPages,
    setCurrentPage,
  } = usePagination<TaxDataModel>({
    items: sortedData,
    itemsPerPage: 10,
  });

  const {
    checkedCount,
    isChecked,
    toggleAll,
    toggleOne,
    setAllChecked,
    isAllChecked,
  } = useCheckAll(pagedData.map((item) => item.id));

  // 탭 변경 시 페이지와 체크박스 상태 리셋
  useEffect(() => {
    setCurrentPage(1);
    setAllChecked(false);
    // setCurrentPage와 setAllChecked는 매 렌더링마다 새로 생성되는 함수로 의존성 배열에 포함하면 useEffect가 계속 실행되어 무한 루프 발생
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTaxType]);

  const handleToggleHidden = () => {
    setShowHidden(!showHidden);
    setCurrentPage(1); // 페이지를 1로 리셋
    setAllChecked(false); // 체크박스 상태 리셋
  };

  const handleHideRestore = () => {
    // 체크된 아이템들의 isHidden 상태를 변경
    const checkedIds = pagedData
      .filter((item) => isChecked(item.id))
      .map((item) => item.id);

    // 실제로는 API 호출을 통해 서버에서 상태를 변경해야 하지만,
    // 여기서는 로컬 상태를 업데이트하는 방식으로 구현
    taxData.forEach((item) => {
      if (checkedIds.includes(item.id)) {
        item.isHidden = !showHidden; // showHidden이 true면 false로, false면 true로
      }
    });

    setAllChecked(false); // 체크박스 상태 리셋
  };

  return (
    <>
      <div className={`flex flex-col gap-8`}>
        <MainTitleSec
          selectedTaxType={selectedTaxType}
          setSelectedTaxType={setSelectedTaxType}
        />
        <div className="px-10 pb-10">
          <div className="flex items-center justify-between pb-4">
            <SearchInput
              value=""
              onChange={() => {}}
              placeholder="찾고 싶은 세금계산서의 거래처나 품목명을 입력하세요."
            />
            <div className="flex gap-1">
              <MiniBtn
                text={checkedCount === 0 ? "숨긴 목록 보기" : "취소"}
                textColor="text-dg"
                borderColor={showHidden ? "border-none" : "border-lg"}
                bgColor={showHidden ? "bg-bg" : "bg-white"}
                hoverColor="hover:bg-bg"
                onClick={handleToggleHidden}
              />
              <MiniBtn
                text={
                  checkedCount === 0
                    ? showHidden
                      ? "복구"
                      : "숨기기"
                    : checkedCount === pagedData.length
                      ? showHidden
                        ? "전체 항목 복구"
                        : "전체 항목 숨기기"
                      : showHidden
                        ? `${checkedCount}개 항목 복구`
                        : `${checkedCount}개 항목 숨기기`
                }
                textColor={checkedCount === 0 ? "text-dg" : "text-white"}
                borderColor={checkedCount === 0 ? "border-lg" : "border-none"}
                bgColor={checkedCount === 0 ? "bg-white" : "bg-primary"}
                hoverColor={
                  checkedCount === 0 ? "hover:bg-bg" : "hover:bg-primary-hover"
                }
                onClick={handleHideRestore}
              />
            </div>
          </div>

          {/* 테이블 */}
          {showHidden && pagedData.length === 0 ? (
            <EmptySpace
              title="아직 숨긴 세금계산서가 없어요."
              description="표시하지 않을 세금계산서를 숨기면 이곳에서 다시 볼 수 있어요."
              height="h-50"
              className="mt-2"
            />
          ) : (
            <div className="w-full overflow-x-auto h-[627px] overflow-y-hidden">
              <TableHeader
                checkedCount={checkedCount}
                onToggleAll={toggleAll}
                onSortClick={handleSortClick}
                sortDirection={sortDirection}
                isAllChecked={isAllChecked}
              />
              {pagedData.map((item) => (
                <TableItem
                  key={item.id}
                  onItemClick={() => handleOpenPanel(item)}
                  item={item}
                  onToggle={() => toggleOne(item.id)}
                  isChecked={isChecked(item.id)}
                />
              ))}
            </div>
          )}
          {totalPages >= 2 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>
      {isPanelOpen && selectedItem && (
        <TaxDetailPanel item={selectedItem} onClose={handleClosePanel} />
      )}
    </>
  );
};

const TaxPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Spinner />
        </div>
      }
    >
      <TaxPageContent />
    </Suspense>
  );
};

export default TaxPage;
