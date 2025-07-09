"use client";

import { useParams, notFound } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { projectData, ProjectDataModel } from "@/mocks/project-data";
import completedProjectData, {
  CompletedProjectDataModel,
} from "@/mocks/completed-project-data";
import usePageStatusStore from "@/store/page-status-store";
import ProductFlowTitle from "../product-flow-title";
import ProductionPlan from "../production-plan";
import ProductionMonitor from "../production-monitor";
import ProductionLog from "../production-log";
import Delivery from "../delivery";
import TaxDocumentView from "../../document/tax-document-view";
import TransactionDocumentView from "../../document/transaction-document-view";
import OrderDocumentView from "../../document/order-document-view";
import { ProjectStatusType } from "@/types/status-type";
import { ProductionTabType } from "@/components/top-bar/types";
import Spinner from "@/ui/spinner";

const getTabsByStatus = (status: string): ProductionTabType[] => {
  if (status === "생산 대기") return ["생산 계획", "주문서"];
  if (status === "생산 중") return ["생산 현황", "생산 계획", "주문서"];
  if (status === "생산 완료") return ["생산 현황", "생산 내역", "주문서"];
  if (status === "납품") return ["납품", "생산 현황", "생산 내역", "주문서"];
  if (status === "프로젝트 완료")
    return [
      "세금계산서",
      "거래명세서",
      "납품",
      "생산 현황",
      "생산 내역",
      "주문서",
    ];
  return ["생산 계획", "주문서"];
};

const ProductionPageContent = () => {
  const params = useParams();
  const id = Number(params.id);
  const setPageStatus = usePageStatusStore((state) => state.setPageStatus); // 바뀐 프로젝트상태 전역상태로로관리 -> top-bar 상태에 적용
  const [selectedTab, setSelectedTab] = useState(0);
  const setProductionTab = usePageStatusStore(
    (state) => state.setProductionTab, // 바뀐 탭 전역상태로관리 -> top-bar 상태에 적용
  );

  const project =
    projectData.find((item: ProjectDataModel) => item.id === id) ||
    completedProjectData.find(
      (item: CompletedProjectDataModel) => item.id === id,
    );

  // Determine if the project is a stopped (중단) completed project
  const isStopped = project && "status" in project && project.status === "중단"; // '보관된 프로젝트에서 중단 상태이면 is Stopped ture'

  const newStatus =
    project?.status === "완료" ? "프로젝트 완료" : project?.status || null;
  const tabs = getTabsByStatus(newStatus || "");

  useEffect(() => {
    if (!project || isStopped) return;
    setPageStatus(newStatus);
    setProductionTab(tabs[selectedTab]);
    return () => {
      setPageStatus(null);
      setProductionTab(null);
    };
  }, [
    project,
    isStopped,
    newStatus,
    selectedTab,
    setPageStatus,
    setProductionTab,
    tabs,
  ]);

  if (!project || isStopped) return notFound();

  return (
    <div className="w-full h-full flex-1 flex flex-col min-h-0">
      <ProductFlowTitle
        status={newStatus as ProjectStatusType}
        tabs={tabs}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
      />

      {tabs[selectedTab] === "세금계산서" && (
        <div className="px-10 py-5">
          <TaxDocumentView taxType="매출" />
        </div>
      )}
      {tabs[selectedTab] === "거래명세서" && (
        <div className="px-10 py-5">
          <TransactionDocumentView />
        </div>
      )}
      {tabs[selectedTab] === "납품" && <Delivery />}
      {tabs[selectedTab] === "생산 현황" && (
        <div className="flex-1 min-h-0">
          <ProductionMonitor />
        </div>
      )}
      {tabs[selectedTab] === "생산 내역" && <ProductionLog />}
      {tabs[selectedTab] === "생산 계획" && <ProductionPlan />}
      {tabs[selectedTab] === "주문서" && (
        <div className="px-10 pt-5 pb-10">
          <OrderDocumentView />
        </div>
      )}
    </div>
  );
};

const ProductionPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Spinner />
        </div>
      }
    >
      <ProductionPageContent />
    </Suspense>
  );
};

export default ProductionPage;
