'use client'

import { useState, useEffect } from 'react'
import ProductInfo from './product-info'
import MiniBtn from '@/ui/mini-btn'
import StockStatus from './stock-status'
import ProductStockLog from './product-stock-log'
import Panel from '@/ui/panel'
import Spinner from '@/ui/spinner'
import { ProductModel, ProductResponseModel } from '@/types/data-model'
import { useGetProduct, useCreateProduct, useUpdateProduct } from '@/hooks'
import NoHistoryBox from '../no-history-box'
import ConnectMaterialModal from '../modals/connect-material-modal'
import ProductStockModal from '../modals/product-stock-modal'
import MaterialStockStatusModal from '../modals/material-stock-status-modal'
import StockLocation from './stock-location'
import StockLocationUploadModal from '../modals/stock-location-upload-modal'
import useFactoryStore from '@/store/factory-store'

interface ProductDetailProps {
  productId: number | null
  productList: ProductResponseModel[]
  onClose: () => void
  onSuccess?: () => void
}

const ProductDetail = ({ productId, productList, onClose, onSuccess }: ProductDetailProps) => {
  const { getProductDetail, product } = useGetProduct()
  const { createProduct } = useCreateProduct()
  const { updateProduct } = useUpdateProduct()
  const factoryId = useFactoryStore((state) => state.factoryId)

  const [formData, setFormData] = useState<ProductModel>({
    factory: factoryId as number,
    name: '',
    code: '',
    unit: '',
    spec: '',
    current_stock: undefined,
    average_production_time: undefined,
    buffer_rate: undefined,
    location: undefined,
    note: '',
  })

  // 폼 유효성 검사
  const isFormValid = formData.name && formData.code && formData.unit && formData.spec
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false)
  const [isProductStockModalOpen, setIsProductStockModalOpen] = useState(false) // 판넬의 연결하기 버튼 모달
  const [isMaterialStockStatusModalOpen, setIsMaterialStockStatusModalOpen] = useState(false) // 판넬의 원자재 재고 상태 모달

  // StockLocationItem 개수를 관리하는 상태
  const [stockLocationCount, setStockLocationCount] = useState(1)
  // 각 StockLocationItem 별 모달 오픈 상태 관리
  const [openUploadModals, setOpenUploadModals] = useState<boolean[]>([false])

  // productId가 변경되면 상세 정보 로드
  useEffect(() => {
    if (productId) {
      getProductDetail(productId)
    }
  }, [productId, getProductDetail])

  // product가 로드되면 formData 업데이트
  useEffect(() => {
    if (productId && product) {
      setFormData({
        factory: product.factory,
        name: product.name,
        code: product.code,
        unit: product.unit,
        spec: product.spec,
        current_stock: product.current_stock,
        average_production_time: product.average_production_time,
        buffer_rate: product.buffer_rate,
        location: product.location?.toString() || '',
        note: product.note,
      })
    } else if (!productId) {
      setFormData({
        factory: factoryId as number,
        name: '',
        code: '',
        unit: '',
        spec: '',
        current_stock: undefined,
        average_production_time: undefined,
        buffer_rate: undefined,
        location: undefined,
        note: '',
      })
    }
  }, [productId, product, factoryId])

  // factory ID가 없으면 로딩 상태나 에러 메시지를 표시
  if (!factoryId) {
    return (
      <Panel title="품목 재고관리" onClose={onClose}>
        <div className="flex flex-col items-center justify-center h-100 gap-3">
          <Spinner />
        </div>
      </Panel>
    )
  }

  // StockLocationItem 추가 함수
  const handleAddStockLocation = () => {
    setStockLocationCount((prev) => prev + 1)
    setOpenUploadModals((prev) => [...prev, false])
  }

  // StockLocationItem 삭제 함수
  const handleDeleteStockLocation = (index: number) => {
    setStockLocationCount((prev) => Math.max(1, prev - 1))
    setOpenUploadModals((prev) => prev.filter((_, i) => i !== index))
  }

  // Plus 버튼 클릭 시 모달 오픈
  const handleOpenUploadModal = (index: number) => {
    setOpenUploadModals((prev) => prev.map((open, i) => (i === index ? true : open)))
  }
  // 모달 닫기
  const handleCloseUploadModal = (index: number) => {
    setOpenUploadModals((prev) => prev.map((open, i) => (i === index ? false : open)))
  }

  // 저장 함수
  const handleSave = async () => {
    try {
      if (productId) {
        // 수정 모드
        // factory 필드는 수정 시 제외 (서버에서 Factory 인스턴스를 기대함)
        const { factory: _factory, ...updateDataWithoutFactory } = formData
        const updateData = {
          ...updateDataWithoutFactory,
          current_stock: formData.current_stock ? Number(formData.current_stock) : undefined,
          average_production_time: formData.average_production_time
            ? Number(formData.average_production_time)
            : undefined,
          buffer_rate: formData.buffer_rate ? Number(formData.buffer_rate) : undefined,
        }
        const result = await updateProduct(productId, updateData)
        if (result && result.success) {
          onSuccess?.()
          onClose()
        } else {
          alert('품목 수정에 실패하였습니다. ' + (result?.error || '알 수 없는 오류'))
        }
      } else {
        // 생성 모드
        // 데이터 변환
        const createData = {
          ...formData,
          current_stock: formData.current_stock ? Number(formData.current_stock) : undefined,
          average_production_time: formData.average_production_time
            ? Number(formData.average_production_time)
            : undefined,
          buffer_rate: formData.buffer_rate ? Number(formData.buffer_rate) : undefined,
        }
        const result = await createProduct(createData)
        if (result && result.success) {
          onSuccess?.()
          onClose()
        } else {
          alert('품목 생성에 실패하였습니다. ' + (result?.error || '알 수 없는 오류'))
        }
      }
    } catch (error) {
      alert('저장 중 오류가 발생했습니다. ' + error)
    }
  }

  return (
    <>
      <Panel
        title="품목 재고관리"
        onClose={onClose}
        headerButton={
          <MiniBtn
            text="저장"
            textColor="text-primary"
            bgColor="bg-primary-8"
            hoverColor="hover:bg-secondary-hover"
            onClick={handleSave}
            disabled={!isFormValid}
          />
        }
      >
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            <h3 className="Heading-3 text-dg h-10 flex items-center">품목 정보</h3>
            <ProductInfo
              formData={formData}
              productList={productList}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, ...value }))}
              productId={productId}
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="h-10 flex items-center justify-between">
              <h3 className="Heading-3 h-10 flex items-center text-dg ">품목이 보관된 창고 위치</h3>
              <MiniBtn
                text="추가"
                textColor="text-dg"
                borderColor="border-lg"
                hoverColor="hover:bg-bg"
                onClick={handleAddStockLocation}
              />
            </div>
            {productId === null ? ( // 창고 위치가 없을 때로 조건 바꿔야 함
              stockLocationCount > 0 ? (
                <StockLocation
                  itemCount={stockLocationCount}
                  onItemDelete={handleDeleteStockLocation}
                  onPlusClick={handleOpenUploadModal}
                />
              ) : (
                <NoHistoryBox
                  title="등록된 창고 위치가 아직 없어요."
                  text="[추가] 버튼을 눌러 원자재가 보관된 창고를 등록해보세요."
                />
              )
            ) : (
              // 상세 모드
              <StockLocation
                itemCount={stockLocationCount}
                onItemDelete={handleDeleteStockLocation}
                onPlusClick={handleOpenUploadModal}
              />
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="h-10 flex items-center justify-between">
              <h3 className="Heading-3 h-10 flex items-center text-dg ">품목과 연결된 자재 정보</h3>
              <MiniBtn
                text="연결"
                textColor="text-dg"
                borderColor="border-lg"
                hoverColor="hover:bg-bg"
                onClick={() => setIsMaterialModalOpen(true)}
              />
            </div>
            {productId === null ? ( // 원자재가 없을 때로 조건 바꿔야함
              <NoHistoryBox
                title="이 품목에 연결된 원자재가 아직 없어요."
                text="원자재를 연결하면 이곳에서 재고 상태를 확인할 수 있어요."
              />
            ) : (
              // 상세 모드
              <StockStatus setIsMaterialStockStatusModalOpen={setIsMaterialStockStatusModalOpen} />
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="h-10 flex items-center justify-between">
              <h3 className="Heading-3 text-dg h-10 flex items-center">품목 입·출고 내역</h3>
              <p className="Me_Body-1 text-gr">최근 3개월 기준</p>
            </div>
            {productId === null ? ( // 재고가 없을 때로 조건을 바꿔야 함
              <NoHistoryBox
                title="아직 등록된 재고 이력이 없어요."
                text="입고나 출고와 관련된 재고 이력이 등록되면 이곳에서 확인할 수 있어요."
              />
            ) : (
              // 상세 모드
              <ProductStockLog setIsProductStockModalOpen={setIsProductStockModalOpen} />
            )}
          </div>
        </div>
      </Panel>

      {/* 모달 */}
      {isMaterialModalOpen && (
        <ConnectMaterialModal onClose={() => setIsMaterialModalOpen(false)} />
      )}
      {isProductStockModalOpen && (
        <ProductStockModal onClose={() => setIsProductStockModalOpen(false)} />
      )}
      {isMaterialStockStatusModalOpen && (
        <MaterialStockStatusModal onClose={() => setIsMaterialStockStatusModalOpen(false)} />
      )}
      {/* 각 StockLocationItem 별 모달 렌더링 */}
      {openUploadModals.map((open, idx) =>
        open ? (
          <StockLocationUploadModal key={idx} onClose={() => handleCloseUploadModal(idx)} />
        ) : null
      )}
    </>
  )
}

export default ProductDetail
