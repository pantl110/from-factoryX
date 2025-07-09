"use client";

import { useState } from "react";
import MainTitleSec from "./main-title-sec";
import Checkbox from "@/ui/checkbox";
import { CaretUpDownIcon } from "@phosphor-icons/react";
import { useCheckAll } from "@/hooks/use-check-all";
import usePagination from "@/hooks/use-pagination";
import TableItem from "./table-item";
import SearchDeleteTable from "@/ui/search-delete-table";
import DeleteModal from "@/ui/modal/delete-modal";
import TaxDetailPanel from "../tax-detail-panel";
import { taxData } from "@/mocks/tax-data";
import useToast from "@/hooks/use-toast";
import Toast from "@/ui/toast";
import { CheckCircle } from "@phosphor-icons/react";
import Pagination from "@/components/pagination";

const TaxDraftPage = () => {
  const [selectedTab, setSelectedTab] = useState<
    "전체" | "임시 저장" | "발행 대기"
  >("전체");

  const [isTaxDetailPanelOpen, setIsTaxDetailPanelOpen] = useState(false);

  // 정렬 상태 관리
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // 임시데이터
  const tempData = [
    {
      id: 1,
      status: "임시 저장",
      type: "-",
      companyName: "플라스틱이 좋아",
      supplyPrice: 100000,
      taxPrice: 10000,
      totalPrice: 110000,
      date: "2025-01-02",
    },
    {
      id: 2,
      status: "발행 대기",
      type: "-",
      companyName: "플라스틱이 싫어",
      supplyPrice: 100000,
      taxPrice: 10000,
      totalPrice: 110000,
      date: "2025-01-01",
    },
  ];

  // 탭에 따른 필터링된 데이터
  const filteredData =
    selectedTab === "전체"
      ? tempData
      : tempData.filter((item) => item.status === selectedTab);

  // 정렬된 데이터
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortOrder === "asc") {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    } else if (sortOrder === "desc") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    return 0;
  });

  // 페이지네이션 훅 사용
  const { currentItems, currentPage, totalPages, setCurrentPage } =
    usePagination({
      items: sortedData,
      itemsPerPage: 10,
    });

  // useCheckAll 훅 사용 (현재 페이지 데이터 기준)
  const {
    checkedCount,
    isAllChecked,
    isChecked,
    toggleAll,
    toggleOne,
    setAllChecked,
    getDeleteButtonText,
  } = useCheckAll(currentItems.map((item) => item.id));

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { isToastOpen, isVisible, showToast } = useToast(2000);

  const handlePanelClose = () => {
    setIsTaxDetailPanelOpen(false);
  };

  const handleIssueClick = () => {
    setIsTaxDetailPanelOpen(false);
    // 판넬이 닫힌 후 토스트 나오기 위해 250ms 딜레이
    setTimeout(() => {
      showToast();
    }, 250);
  };

  // 발행일자 정렬 핸들러
  const handleDateSort = () => {
    if (sortOrder === "desc") {
      setSortOrder("asc");
    } else {
      setSortOrder("desc");
    }
    // 정렬 변경 시 첫 페이지로 이동
    setCurrentPage(1);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 페이지 변경 시 체크박스 초기화
    setAllChecked(false);
  };

  // 탭 변경 핸들러
  const handleTabChange = (tab: "전체" | "임시 저장" | "발행 대기") => {
    setSelectedTab(tab);
    // 탭 변경 시 첫 페이지로 이동하고 체크박스 초기화
    setCurrentPage(1);
    setAllChecked(false);
  };

  return (
    <>
      <div className={`flex flex-col gap-8`}>
        <MainTitleSec
          selectedTab={selectedTab}
          setSelectedTab={handleTabChange}
        />
        <div className="px-10 pb-10">
          <SearchDeleteTable
            checkedCount={checkedCount}
            deleteButtonText={getDeleteButtonText()}
            onDelete={() => setIsDeleteModalOpen(true)}
            onCancel={() => setAllChecked(false)}
          />
          <div className="w-full overflow-y-auto">
            <div className="flex items-center h-12 min-w-[1272px] border-t border-b border-lg Me_Body-1 text-sv rounded-sm">
              <Checkbox isChecked={isAllChecked} onToggle={toggleAll} />
              <p className="px-3 w-[150px]">진행상태</p>
              <p className="px-3 flex-2">구분</p>
              <p className="px-3 flex-2">업체명</p>
              <p className="px-3 w-[200px]">공급가액</p>
              <p className="px-3 w-[200px]">세액</p>
              <p className="px-3 w-[200px]">합계금액</p>
              <div
                className="px-3 w-[200px] h-full flex items-center gap-1 hover:bg-bg cursor-pointer"
                onClick={handleDateSort}
              >
                <p className="">발행일자</p>
                <CaretUpDownIcon size={21} className="text-sv" />
              </div>
            </div>
            {currentItems.map((item) => (
              <TableItem
                key={item.id}
                item={item}
                isChecked={isChecked(item.id)}
                onToggle={() => toggleOne(item.id)}
                onItemClick={() => setIsTaxDetailPanelOpen(true)}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
      {isDeleteModalOpen && (
        <DeleteModal
          onClose={() => setIsDeleteModalOpen(false)}
          onDelete={() => {
            setIsDeleteModalOpen(false);
            setAllChecked(false);
          }}
        />
      )}
      {isTaxDetailPanelOpen && (
        <TaxDetailPanel
          onClose={handlePanelClose}
          item={taxData[0]}
          isDraft={true}
          onIssueClick={handleIssueClick}
        />
      )}

      {isToastOpen && (
        <Toast
          icon={<CheckCircle size={20} className="text-primary" />}
          text="세금계산서 발행이 완료되었어요."
          subtext="세금계산서는 발행일 기준으로 처리돼요."
          type="primary"
          isVisible={isVisible}
        />
      )}
    </>
  );
};

export default TaxDraftPage;
