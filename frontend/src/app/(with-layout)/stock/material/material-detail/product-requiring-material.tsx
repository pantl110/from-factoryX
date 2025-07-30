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

interface ProductRequiringMaterialProps {
  materialId: number;
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
>(({ materialId }, ref) => {
  const { getMaterialProductConnections, data: connections } =
    useMaterialProduct();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [productConnections, setProductConnections] = useState<
    ConnectionModelType[]
  >([]);

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

  // 연결 모델에서 제품 정보를 추출하는 헬퍼 함수
  const getProductInfo = (connection: ConnectionModelType) => {
    // MaterialProductConnectionModel인지 확인
    if ('material_name' in connection) {
      return {
        name: connection.material_name,
        code: connection.material_code,
        spec: connection.material_spec,
        unit: connection.material_unit,
      };
    }
    // ProductMaterialConnectionModel인지 확인
    if ('product_name' in connection) {
      return {
        name: connection.product_name,
        code: connection.product_code,
        spec: connection.product_spec,
        unit: connection.product_unit,
      };
    }
    return { name: '-', code: '-', spec: '-', unit: '-' };
  };

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
          {productConnections.map((connection) => {
            const productInfo = getProductInfo(connection);
            return (
              <ProductRequiringMaterialItem
                key={connection.connection_id}
                productName={productInfo.name}
                productCode={productInfo.code}
                size={productInfo.spec}
                unit={productInfo.unit}
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
