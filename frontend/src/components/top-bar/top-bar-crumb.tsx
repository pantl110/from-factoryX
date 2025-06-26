import { usePathname } from "next/navigation";
import { CaretRight } from "@phosphor-icons/react";
import { projectData } from "@/mocks/project-data";
import { SelectedTabType, SelectedChipType } from "./types";

const crumbNameMap: Record<string, string> = {
  dashboard: "대시보드",
  project: "프로젝트 관리",
  completed: "보관된 프로젝트",
  process: "진행 중인 프로젝트",
  stock: "재고관리",
  tax: "세무/회계",
  document: "문서함",
  setting: "설정",
  production: "프로젝트 관리",
  return: "반품 관리",
  quotation: "프로젝트 관리",
};

interface TopBarCrumbProps {
  pageStatus: string;
  selectedTab?: SelectedTabType;
  selectedChip?: SelectedChipType;
}

const TopBarCrumb = ({
  pageStatus,
  selectedTab,
  selectedChip,
}: TopBarCrumbProps) => {
  const pathname = usePathname();
  const crumbs = pathname.split("/").filter(Boolean);

  // production/숫자 경로 판별
  const isProductionDetail =
    crumbs[0] === "production" && crumbs[1] && /^\d+$/.test(crumbs[1]);
  let companyName: string | undefined;
  if (isProductionDetail) {
    const project = projectData.find((p) => String(p.id) === crumbs[1]);
    companyName = project?.companyName;
  }

  let finalCrumbs: string[] = crumbs;
  if (isProductionDetail) {
    if (pageStatus === "완료" || pageStatus === "프로젝트 완료") {
      finalCrumbs = ["project", "completed"];
    } else {
      finalCrumbs = ["project", "process"];
    }
    if (companyName) finalCrumbs.push(companyName);
  }

  // 설정 페이지인 경우 탭과 칩 상태 추가
  if (crumbs[0] === "setting") {
    if (selectedTab === "system") {
      finalCrumbs = ["setting", "시스템 설정"];
      if (
        selectedChip &&
        ["general", "permission", "subscription"].includes(selectedChip)
      ) {
        const chipNameMap: Record<string, string> = {
          general: "일반",
          permission: "권한 설정",
          subscription: "구독 관리",
        };
        finalCrumbs.push(chipNameMap[selectedChip]);
      }
    } else if (selectedTab === "master") {
      finalCrumbs = ["setting", "마스터 데이터 관리"];
      if (selectedChip && ["equipment", "client"].includes(selectedChip)) {
        const chipNameMap: Record<string, string> = {
          equipment: "설비 관리",
          client: "거래처 정보",
        };
        finalCrumbs.push(chipNameMap[selectedChip]);
      }
    }
  }

  return (
    <div className="flex items-center gap-1">
      {finalCrumbs.map((crumb, idx) => (
        <div key={idx} className="flex items-center gap-1 ">
          <p className="Re_Body-1 text-dg">{crumbNameMap[crumb] || crumb}</p>
          {idx < finalCrumbs.length - 1 && (
            <CaretRight size={16} className="text-[#8c8c8c]" />
          )}
        </div>
      ))}
    </div>
  );
};

export default TopBarCrumb;
