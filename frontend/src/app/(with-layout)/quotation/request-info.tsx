import MiniBtn from "@/ui/mini-btn";
import ProductItem from "./product-item";
import dummyProducts from "@/mocks/quotation-products";

const RequestInfo = () => {
  return (
    <div className="pl-8 flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <h3 className="Heading-3">요청정보</h3>
        <MiniBtn
          text="품목 추가하기"
          textColor="text-dg"
          borderColor="border-[#eeeeee]"
          iconColor="text-sv"
        />
      </div>

      <div className="w-[938px]">
        <div className="w-full h-12 flex items-center bg-bg Me_Body-1 rounded text-sv">
          <p className="flex-1 px-3">품목정보</p>
          <p className="flex-1 px-3">품목코드</p>
          <p className="flex-1 px-3">규격</p>
          <p className="w-[80px] px-3">단위</p>
          <p className="w-[100px] px-3">단가</p>
          <p className="flex-1 px-3">제작수량</p>
          <p className="flex-1 px-3">금액</p>
        </div>
        {dummyProducts.map((item, index) => (
          <ProductItem key={index} {...item} />
        ))}
      </div>
    </div>
  );
};

export default RequestInfo;
