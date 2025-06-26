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

  const handleClick = () => {
    if (status === "견적 협의") return;
    router.push(`/production/${id}`);
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
      <p className="flex-2 py-1 px-3 text-dg">{companyName}</p>
      <p className="flex-2 py-1 px-3 text-dg">{items}</p>
      <p className="w-[200px] py-1 px-3 text-dg">{startDate}</p>
      <p className="w-[200px] py-1 px-3 text-dg">{endDate}</p>
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <p
          className={`w-[200px] py-1 px-3 ${transactionColor} cursor-pointer`}
          onClick={openTransactionDropdown}
        >
          {transactionIssued}
        </p>
      </div>
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
    </div>
  );
};

export default TableItem;
