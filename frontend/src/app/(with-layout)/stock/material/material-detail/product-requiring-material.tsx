import ProductRequiringMaterialItem from './product-requiring-material-item';
import {
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { useMaterialProduct, useGetProduct } from '@/hooks';
import {
  MaterialProductConnectionModel,
  ProductResponseModel,
} from '@/types/data-model';
import NoHistoryBox from '@/ui/no-history-box';

interface ProductRequiringMaterialProps {
  materialId: number;
}

export interface ProductRequiringMaterialRefModel {
  refresh: () => void;
}

const ProductRequiringMaterial = forwardRef<
  ProductRequiringMaterialRefModel,
  ProductRequiringMaterialProps
>(({ materialId }, ref) => {
  const { getMaterialProductConnections, data: connections } =
    useMaterialProduct();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { getProductDetail } = useGetProduct();
  const [productConnections, setProductConnections] = useState<
    MaterialProductConnectionModel[]
  >([]);
  const [productDetails, setProductDetails] = useState<
    Record<number, ProductResponseModel>
  >({});

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
    } else if (connections && connections.created_connections) {
      // API 응답이 MaterialProductConnectionResponseModel 형태인 경우
      setProductConnections(connections.created_connections);
    }
  }, [connections]);

  // 제품 상세 정보 가져오기
  useEffect(() => {
    if (productConnections.length > 0) {
      productConnections.forEach(async (connection) => {
        if (connection.product_id && !productDetails[connection.product_id]) {
          try {
            const result = await getProductDetail(connection.product_id);
            if (result.success && result.data) {
              setProductDetails((prev) => ({
                ...prev,
                [connection.product_id]: result.data,
              }));
            }
          } catch {
            throw new Error('제품 상세 정보 조회 실패');
          }
        }
      });
    }
  }, [productConnections, getProductDetail, productDetails]);

  // 외부에서 호출할 수 있는 refresh 함수
  const refresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // ref를 통해 refresh 함수 노출
  useImperativeHandle(
    ref,
    () => ({
      refresh,
    }),
    [refresh]
  );

  return (
    <div className="flex flex-col">
      {productConnections.length > 0 ? (
        <>
          <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1">
            <p className="flex-1 py-1 px-3 text-sv">품목명</p>
            <p className="flex-1 py-1 px-3 text-sv">품목 코드</p>
            <p className="flex-1 py-1 px-3 text-sv">규격</p>
            <p className="w-[80px] py-1 px-3 text-sv">단위</p>
          </div>
          {productConnections.map((connection, index) => {
            const productDetail = productDetails[connection.product_id];
            return (
              <ProductRequiringMaterialItem
                key={connection.id || index}
                productName={productDetail?.name || '-'}
                productCode={productDetail?.code || '-'}
                size={productDetail?.spec || '-'}
                unit={productDetail?.unit || '-'}
              />
            );
          })}
        </>
      ) : (
        <NoHistoryBox
          title="이 원자재에 연결된 품목이 아직 없어요."
          text="품목을 연결하면, 자재가 사용되는 품목이 이곳에 표시돼요."
        />
      )}
    </div>
  );
});

ProductRequiringMaterial.displayName = 'ProductRequiringMaterial';

export default ProductRequiringMaterial;
