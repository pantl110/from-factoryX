import ProductRequiringMaterialItem from './product-requiring-material-item';
import {
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { useMaterialProduct } from '@/hooks';
import {
  MaterialProductConnectionModel,
  ProductMaterialConnectionModel,
} from '@/types/data-model';
import NoHistoryBox from '@/ui/no-history-box';
import Pagination from '@/components/pagination';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import MiniBtn from '@/ui/mini-btn';

interface ProductRequiringMaterialProps {
  materialId: number;
  handleOpenDeleteModal: (connectionId: number) => void;
  onProductClick: (productId: number) => void;
  setIsProductEnrollmentModalOpen: (isOpen: boolean) => void;
}

export interface ProductRequiringMaterialRefModel {
  refresh: () => void;
}

type ConnectionModelType =
  | MaterialProductConnectionModel
  | ProductMaterialConnectionModel;

const ProductRequiringMaterial = forwardRef<
  ProductRequiringMaterialRefModel,
  ProductRequiringMaterialProps
>(
  (
    {
      materialId,
      handleOpenDeleteModal,
      onProductClick,
      setIsProductEnrollmentModalOpen,
    },
    ref
  ) => {
    const role = useMemberStore((state) => state.role);
    const isViewer = role === 'viewer';
    const hasSubscription = useSubscriptionStore(
      (state) => state.hasSubscription
    );

    const { getMaterialProductConnections, data: connections } =
      useMaterialProduct();
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [productConnections, setProductConnections] = useState<
      ConnectionModelType[]
    >([]);

    // 페이지네이션 상태
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;
    const totalPages = Math.ceil(productConnections.length / pageSize);

    // 현재 페이지의 연결된 제품들만 표시
    const getCurrentPageConnections = () => {
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      return productConnections.slice(startIndex, endIndex);
    };

    // 페이지 변경 핸들러
    const handlePageChange = (page: number) => {
      setCurrentPage(page);
    };

    // materialId나 refreshTrigger가 변경될 때마다 연결된 제품들을 가져오기
    useEffect(() => {
      if (materialId) {
        getMaterialProductConnections(materialId, 'material');
      }
    }, [materialId, refreshTrigger, getMaterialProductConnections]);

    // connections 데이터가 업데이트되면 상태 업데이트
    useEffect(() => {
      if (connections && Array.isArray(connections)) {
        setProductConnections(connections);
        setCurrentPage(1); // 데이터가 변경되면 첫 페이지로 리셋
      } else if (connections && connections.created_connections) {
        // API 응답이 MaterialProductConnectionResponseModel 형태인 경우
        setProductConnections(connections.created_connections);
        setCurrentPage(1); // 데이터가 변경되면 첫 페이지로 리셋
      }
    }, [connections]);

    // 외부에서 호출할 수 있는 refresh 함수
    const refresh = useCallback(() => {
      setRefreshTrigger((prev) => prev + 1);
      setCurrentPage(1); // 새로고침 시 첫 페이지로 리셋
    }, []);

    // ref를 통해 refresh 함수 노출
    useImperativeHandle(
      ref,
      () => ({
        refresh,
      }),
      [refresh]
    );

    // 연결 모델에서 제품 정보를 추출하는 헬퍼 함수
    const getProductInfo = (connection: ConnectionModelType) => {
      // MaterialProductConnectionModel인지 확인
      if ('material_name' in connection) {
        return {
          name: connection.material_name,
          code: connection.material_code,
          spec: connection.material_spec,
          unit: connection.material_unit,
          id: connection.material_id || 0,
        };
      }
      // ProductMaterialConnectionModel인지 확인
      if ('product_name' in connection) {
        return {
          name: connection.product_name,
          code: connection.product_code,
          spec: connection.product_spec,
          unit: connection.product_unit,
          id: connection.product_id || 0,
        };
      }
      return { name: '-', code: '-', spec: '-', unit: '-', id: 0 };
    };

    return (
      <div className="flex flex-col gap-3">
        <div className="h-10 flex items-center justify-between">
          <h3 className="Heading-3 text-dg">이 자재가 사용된 제품</h3>
          {productConnections.length > 0 && (
            <MiniBtn
              text="제품 연결"
              variant="whiteOutline"
              onClick={() => setIsProductEnrollmentModalOpen(true)}
              disabled={isViewer || !hasSubscription()}
            />
          )}
        </div>

        <div className="flex flex-col">
          {productConnections.length > 0 ? (
            <>
              <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 cursor-default">
                <p className="flex-1 py-1 px-3 text-sv">제품명</p>
                <p className="flex-1 py-1 px-3 text-sv">제품 코드</p>
                <p className="flex-1 py-1 px-3 text-sv">규격</p>
                <p className="flex-1 py-1 px-3 text-sv">단위</p>
                {!isViewer && hasSubscription() && (
                  <p className="w-20 px-3 text-sv">액션</p>
                )}
              </div>
              {getCurrentPageConnections().map((connection) => {
                const productInfo = getProductInfo(connection);
                return (
                  <ProductRequiringMaterialItem
                    key={connection.connection_id}
                    productName={productInfo.name}
                    productCode={productInfo.code}
                    size={productInfo.spec}
                    unit={productInfo.unit}
                    connectionId={connection.connection_id}
                    handleOpenDeleteModal={handleOpenDeleteModal}
                    onProductClick={onProductClick}
                    productId={productInfo.id}
                  />
                );
              })}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          ) : (
            <NoHistoryBox
              title="이 원자재에 연결된 제품이 아직 없어요."
              text="제품을 연결하면, 자재가 사용되는 제품이 이곳에 표시돼요."
              button="제품 연결"
              onClick={() => setIsProductEnrollmentModalOpen(true)}
              disabled={isViewer || !hasSubscription()}
            />
          )}
        </div>
      </div>
    );
  }
);

ProductRequiringMaterial.displayName = 'ProductRequiringMaterial';

export default ProductRequiringMaterial;
