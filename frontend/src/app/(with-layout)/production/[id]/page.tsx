"use client";

import { useParams, notFound } from "next/navigation";
import { useState, useEffect } from "react";
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

const getTabsByStatus = (status: string) => {
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

const ProductionPage = () => {
  const params = useParams();
  const id = Number(params.id);
  const setPageStatus = usePageStatusStore((state) => state.setPageStatus); // 바뀐 프로젝트상태 전역상태로로관리 -> top-bar 상태에 적용
  const [selectedTab, setSelectedTab] = useState(0);
  const setSelectedTabGlobal = usePageStatusStore(
    (state) => state.setSelectedTab, // 바뀐 탭 전역상태로관리 -> top-bar 상태에 적용
  );

  const project =
    projectData.find((item: ProjectDataModel) => item.id === id) ||
    completedProjectData.find(
      (item: CompletedProjectDataModel) => item.id === id,
    );

  if (!project || project.status === "중단") return notFound();

  const newStatus =
    project.status === "완료" ? "프로젝트 완료" : project.status;
  const tabs = getTabsByStatus(newStatus);

  useEffect(() => {
    setPageStatus(newStatus);
    setSelectedTabGlobal(tabs[selectedTab]);
    return () => {
      setPageStatus(null);
      setSelectedTabGlobal(null);
    };
  }, [newStatus, selectedTab, setPageStatus, setSelectedTabGlobal, tabs]);

  return (
    <div className="w-full">
      <ProductFlowTitle
        status={newStatus}
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
      {tabs[selectedTab] === "생산 현황" && <ProductionMonitor />}
      {tabs[selectedTab] === "생산 내역" && <ProductionLog />}
      {tabs[selectedTab] === "생산 계획" && <ProductionPlan />}
      {tabs[selectedTab] === "주문서" && (
        <div className="px-10 py-5">
          <OrderDocumentView />
        </div>
      )}
    </div>
  );
};

export default ProductionPage;
