import localFont from "next/font/local";
import "./globals.css";

import SideBar from "@/components/side-bar";
import TopBar from "@/components/top-bar";

const pretendard = localFont({
  src: [
    {
      path: "../assets/fonts/pretendard/Pretendard-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/fonts/pretendard/Pretendard-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../assets/fonts/pretendard/Pretendard-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../assets/fonts/pretendard/Pretendard-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-pretendard",
  display: "swap",
});

export const metadata = {
  title: "Factory_X",
  description: "Factory_X",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body
        className={`${pretendard.className} antialiased`}
        suppressHydrationWarning={process.env.NODE_ENV === "development"}
      >
        <div className="min-h-screen">
          <SideBar />
          <div className="ml-64 flex flex-col min-h-screen">
            <div className="max-w-[1400px] min-w-[1200px] mx-auto w-full">
              <TopBar />
            </div>
            <div className="w-full h-[1px] bg-[#eeeeee]" />
            <div className="max-w-[1400px] min-w-[1200px] mx-auto w-full flex-1">
              <main className="flex-1">{children}</main>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
};

export default RootLayout;
