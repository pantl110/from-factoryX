"use client";

import Chip from "@/ui/chip";
import { useRouter } from "next/navigation";
import {
  ProjectStatusType,
  ProjectStatusColorMap,
  TransactionStatusType,
  TaxStatusType,
  TransactionStatusColorMap,
  TaxStatusColorMap,
} from "@/types/status-type";
import TransactionStateDropdown from "./modals/transaction-state-dropdown";
import TaxStateDropdown from "./modals/tax-state-dropdown";
import { usePortalDropdown } from "@/hooks/use-portal-dropdown";
import { DotsThree } from "@phosphor-icons/react";
import DeleteDropdown from "@/ui/dropdown/delete-dropdown";

interface TableItemProps {
  id: number;
  status: ProjectStatusType;
  companyName: string;
  items: string;
  startDate: string;
  endDate: string;
  transactionIssued: TransactionStatusType;
  taxIssued: TaxStatusType;
  isDeleteBtnClicked: boolean;
}

const TableItem = ({
  id,
  status,
  companyName,
  items,
  startDate,
  endDate,
  transactionIssued,
  taxIssued,
  isDeleteBtnClicked,
}: TableItemProps) => {
  const router = useRouter();
  const chipColors = ProjectStatusColorMap[status];
  const transactionColor = TransactionStatusColorMap[transactionIssued];
  const taxColor = TaxStatusColorMap[taxIssued];

  const {
    isOpen: isTransactionDropdownOpen,
    openDropdown: openTransactionDropdown,
    closeDropdown: closeTransactionDropdown,
    anchorRect: transactionAnchorRect,
  } = usePortalDropdown();

  const {
    isOpen: isTaxDropdownOpen,
    openDropdown: openTaxDropdown,
    closeDropdown: closeTaxDropdown,
    anchorRect: taxAnchorRect,
  } = usePortalDropdown();

  const {
    isOpen: isDeleteDropdownOpen,
    openDropdown: openDeleteDropdown,
    closeDropdown: closeDeleteDropdown,
    anchorRect: deleteAnchorRect,
  } = usePortalDropdown();

  const handleClick = () => {
    if (status === "견적 협의") router.push(`/quotation`);
    else router.push(`/production/${id}`);
  };

  return (
    <div
      className="flex items-center h-14 w-[1448px] border-b border-[#eeeeee] Me_Body-1 cursor-pointer hover:bg-gray-50"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
    >
      {isDeleteBtnClicked && (
        <div
          className="flex items-center py-3 px-2"
          onClick={(e) => e.stopPropagation()}
        >
          <input type="checkbox" className="w-4 h-4 border-sv" />
        </div>
      )}
      <div className="py-1 px-3 w-[150px]">
        <Chip
          text={status}
          bgColor={chipColors.bgColor}
          textColor={chipColors.textColor}
        />
      </div>
      <p className="flex-2 py-1 px-3 text-dg truncate" title={companyName}>
        {companyName}
      </p>
      <p className="flex-2 py-1 px-3 text-dg truncate" title={items}>
        {items}
      </p>
      <p className="w-[200px] py-1 px-3 text-dg truncate" title={startDate}>
        {startDate}
      </p>
      <p className="w-[200px] py-1 px-3 text-dg truncate" title={endDate}>
        {endDate}
      </p>
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <p
          className={`w-[200px] py-1 px-3 ${transactionColor} cursor-pointer`}
          onClick={openTransactionDropdown}
        >
          {transactionIssued}
        </p>
      </div>

      {/* 발행 여부 dropdown */}
      {isTransactionDropdownOpen && transactionAnchorRect && (
        <div
          style={{
            position: "fixed",
            left: transactionAnchorRect.left,
            top: transactionAnchorRect.bottom,
            zIndex: 10,
            width: transactionAnchorRect.width,
          }}
        >
          <TransactionStateDropdown onClose={closeTransactionDropdown} />
        </div>
      )}
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <p
          className={`w-[200px] py-1 px-3 ${taxColor}`}
          onClick={openTaxDropdown}
        >
          {taxIssued}
        </p>
      </div>
      {isTaxDropdownOpen && taxAnchorRect && (
        <div
          style={{
            position: "fixed",
            left: taxAnchorRect.left,
            top: taxAnchorRect.bottom,
            zIndex: 10,
            width: taxAnchorRect.width,
          }}
        >
          <TaxStateDropdown onClose={closeTaxDropdown} />
        </div>
      )}

      <button
        className="w-9 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200"
        onClick={(e) => {
          e.stopPropagation();
          openDeleteDropdown(e);
        }}
      >
        <DotsThree size={20} className="text-sv" />
      </button>
      {/* Delete dropdown */}
      {isDeleteDropdownOpen && deleteAnchorRect && (
        <div
          style={{
            position: "fixed",
            right: window.innerWidth - deleteAnchorRect.right,
            top: deleteAnchorRect.bottom,
            zIndex: 10,
          }}
        >
          <DeleteDropdown onClose={closeDeleteDropdown} />
        </div>
      )}
    </div>
  );
};

export default TableItem;
