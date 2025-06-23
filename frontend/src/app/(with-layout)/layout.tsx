import TopBar from "@/components/top-bar";
import SideBar from "@/components/side-bar";

const WithLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen">
      <SideBar />
      <div className="ml-64 flex flex-col min-h-screen">
        <div className="max-w-[1400px] min-w-[1000px] mx-auto w-full">
          <TopBar />
        </div>
        <div className="w-full h-[1px] bg-[#eeeeee]" />
        <div className="max-w-[1400px] min-w-[1000px] mx-auto w-full flex-1">
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default WithLayout;
