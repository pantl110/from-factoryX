import MiniBtn from '@/ui/mini-btn';
import ProductItem from './product-item';
import dummyProducts from '@/mocks/quotation-products';
import { ProductModel } from './types';
import { CaretDown } from '@phosphor-icons/react/dist/ssr';

interface RequestInfoProps {
  onProductClick: (product: ProductModel) => void;
  setIsProductEnrollmentModalOpen: (isOpen: boolean) => void;
  clientDataParam: string | null;
}

const RequestInfo = ({
  onProductClick,
  setIsProductEnrollmentModalOpen,
  clientDataParam,
}: RequestInfoProps) => {
  return (
    <>
      <div className="flex justify-between items-center">
        <h3 className="Heading-3">요청정보</h3>
        <MiniBtn
          text="품목 추가하기"
          textColor="text-dg"
          borderColor="border-lg"
          icon={CaretDown}
          iconPosition="right"
          hoverColor="hover:bg-bg"
          onClick={() => setIsProductEnrollmentModalOpen(true)}
        />
      </div>

      {clientDataParam ? (
        <div className="w-full overflow-x-auto mb-30 ">
          <table className="w-full min-w-[938px]">
            <thead>
              <tr className="flex items-center h-12 border-t border-b border-lg Me_Body-1 text-sv rounded-sm">
                <th className="text-left px-3 flex-1">품목명</th>
                <th className="text-left px-3 flex-1">품목 코드</th>
                <th className="text-left px-3 flex-1">규격</th>
                <th className="text-left px-3 w-[80px]">단위</th>
                <th className="text-left px-3 flex-1">제작수량</th>
                <th className="text-left px-3 w-[100px]">단가</th>
                <th className="text-left px-3 flex-1">금액</th>
              </tr>
            </thead>
            <tbody>
              {dummyProducts.map((item, index) => (
                <ProductItem
                  key={index}
                  {...item}
                  onClick={() => onProductClick(item)}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-8 h-full flex flex-col justify-center items-center gap-2 rounded-[4px] border border-[#E4E4E7]">
          <h4 className="Heading-4 text-dg">요청 정보가 아직 없어요.</h4>
          <p className="R_Body-1 text-gr">
            품목을 추가해서 단가를 측정해 보세요.
          </p>
        </div>
      )}
    </>
  );
};

export default RequestInfo;
