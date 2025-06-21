"use client";

import { useParams, notFound } from "next/navigation";
import { useState } from "react";
import { projectData, ProjectDataModel } from "@/mocks/project-data";
import ProductFlowTitle from "../product-flow-title";
import Quotation from "../quotation";
import ProductionPlan from "../production-plan";
import ProductionMonitor from "../production-monitor";
import ProductionLog from "../production-log";
import Delivery from "../delivery";

const getTabsByStatus = (status: string) => {
  if (status === "생산 대기") return ["생산 계획", "주문서"];
  if (status === "생산 중") return ["생산 현황", "생산 계획", "주문서"];
  if (status === "생산 완료" || status === "완료")
    return ["생산 내역", "생산 현황", "생산 계획", "견적서"];
  if (status === "납품")
    return ["납품", "생산 내역", "생산 현황", "생산 계획", "견적서"];
  return ["생산 계획", "견적서"];
};

const ProductionPage = () => {
  const params = useParams();
  const id = Number(params.id);
  const project = projectData.find((item: ProjectDataModel) => item.id === id);

  const tabs = project ? getTabsByStatus(project.status) : [];
  const [selectedTab, setSelectedTab] = useState(0);

  if (!project) return notFound();

  return (
    <div>
      <ProductFlowTitle
        status={project.status}
        tabs={tabs}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
      />
      {tabs[selectedTab] === "납품" && <Delivery />}
      {tabs[selectedTab] === "생산 내역" && <ProductionLog />}
      {tabs[selectedTab] === "생산 현황" && <ProductionMonitor />}
      {tabs[selectedTab] === "생산 계획" && <ProductionPlan />}
      {tabs[selectedTab] === "견적서" && <Quotation />}
    </div>
  );
};

export default ProductionPage;
