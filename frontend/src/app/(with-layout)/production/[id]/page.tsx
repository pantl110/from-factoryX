"use client";

import { useParams, notFound } from "next/navigation";
import { projectData } from "@/mocks/projectData";
import PendingPage from "../pending";
import InProgressPage from "../in-progress";
import CompletedPage from "../completed";
import DeliveryPage from "../delivery";

const ProductionPage = () => {
  const params = useParams();
  const id = Number(params.id);
  const project = projectData.find((item) => item.id === id);

  if (!project) return notFound();

  switch (project.status) {
    case "생산 대기":
      return <PendingPage />;
    case "생산 중":
      return <InProgressPage />;
    case "완료":
      return <CompletedPage />;
    case "납품":
      return <DeliveryPage />;
    default:
      return <div>해당 상태의 상세 페이지가 없습니다.</div>;
  }
};

export default ProductionPage;
