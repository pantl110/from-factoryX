import { usePathname } from "next/navigation";
import { CaretRight } from "@phosphor-icons/react";
import { projectData } from "@/mocks/project-data";

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
};

interface TopBarCrumbProps {
  pageStatus: string;
}

const TopBarCrumb = ({ pageStatus }: TopBarCrumbProps) => {
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
    if (pageStatus === "완료" || pageStatus === "생산 완료") {
      finalCrumbs = ["project", "completed"];
    } else {
      finalCrumbs = ["project", "process"];
    }
    if (companyName) finalCrumbs.push(companyName);
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
