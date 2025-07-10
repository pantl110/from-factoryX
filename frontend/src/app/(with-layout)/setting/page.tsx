import Spinner from "@/ui/spinner";

import { Suspense } from "react";
import SettingPageContent from "./setting-page-content";

const SettingPage = async () => {
  // const resp = await fetch(
  //   "https://factoryxbackend-production.up.railway.app/users/login",
  //   {
  //     headers: {
  //       Authorization: `Bearer ${token}`, // 이 줄이 핵심!
  //       "Content-Type": "application/json",
  //     },
  //   },
  // );

  // if (!resp.ok) {
  //   throw new Error(`API 에러: ${resp.status}`);
  // }
  // const factoryData = await resp.json();
  // console.log("factoryData", factoryData);
  // console.log(factoryData);

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Spinner />
        </div>
      }
    >
      <SettingPageContent />
    </Suspense>
  );
};

export default SettingPage;
