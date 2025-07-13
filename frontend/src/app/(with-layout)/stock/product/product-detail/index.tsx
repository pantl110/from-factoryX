'use client'

import { useState } from 'react'
import ProductInfo from './product-info'
import MiniBtn from '@/ui/mini-btn'
import StockStatus from './stock-status'
import ProductStockLog from './product-stock-log'
import Panel from '@/ui/panel'
import { ProductDataModel } from '@/types/data-model'
import NoHistoryBox from '../no-history-box'
import ConnectMaterialModal from '../modals/connect-material-modal'
import ProductStockModal from '../modals/product-stock-modal'
import MaterialStockStatusModal from '../modals/material-stock-status-modal'
import StockLocation from './stock-location'
import StockLocationUploadModal from '../modals/stock-location-upload-modal'

// '생성' 모드일 때 사용할 비어있는 품목 객체의 초기값
const EMPTY_PRODUCT: ProductDataModel = {
  id: 0,
  productName: '',
  productCode: '',
  size: '',
  unit: '',
  stock: -1,
  productionTime: '',
  location: '',
  comment: [],
}

interface ProductDetailProps {
  product: ProductDataModel | null
  onClose: () => void
  mode: 'create' | 'view'
}

const ProductDetail = ({ product, onClose, mode }: ProductDetailProps) => {
  const isCreateMode = mode === 'create'

  // 생성모드: 빈 객체, 보기모드: 전달받은 product
  const [formData, setFormData] = useState<ProductDataModel>(product || EMPTY_PRODUCT)
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false)
  const [isProductStockModalOpen, setIsProductStockModalOpen] = useState(false) // 판넬의 연결하기 버튼 모달
  const [isMaterialStockStatusModalOpen, setIsMaterialStockStatusModalOpen] = useState(false) // 판넬의 원자재 재고 상태 모달

  // StockLocationItem 개수를 관리하는 상태
  const [stockLocationCount, setStockLocationCount] = useState(1)
  // 각 StockLocationItem 별 모달 오픈 상태 관리
  const [openUploadModals, setOpenUploadModals] = useState<boolean[]>([false])

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
    // console.log("Plus button clicked, index:", index);
    setOpenUploadModals((prev) => prev.map((open, i) => (i === index ? true : open)))
  }
  // 모달 닫기
  const handleCloseUploadModal = (index: number) => {
    setOpenUploadModals((prev) => prev.map((open, i) => (i === index ? false : open)))
  }

  return (
    <>
      <Panel title="품목 재고관리" onClose={onClose}>
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            <h3 className="Heading-3 text-dg h-10 flex items-center">품목 정보</h3>
            <ProductInfo
              product={formData}
              isEditable={isCreateMode} // 생성모드일 때만 수정 가능
              onValueChange={(value) =>
                setFormData((prev: ProductDataModel) => ({ ...prev, ...value }))
              }
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
            {isCreateMode ? (
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
            {isCreateMode ? (
              <NoHistoryBox
                title="이 품목에 연결된 원자재가 아직 없어요."
                text="원자재를 연결하면 이곳에서 재고 상태를 확인할 수 있어요."
              />
            ) : (
              <StockStatus setIsMaterialStockStatusModalOpen={setIsMaterialStockStatusModalOpen} />
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="h-10 flex items-center justify-between">
              <h3 className="Heading-3 text-dg h-10 flex items-center">품목 입·출고 내역</h3>
              <p className="Me_Body-1 text-gr">최근 3개월 기준</p>
            </div>
            {isCreateMode ? (
              <NoHistoryBox
                title="아직 등록된 재고 이력이 없어요."
                text="입고나 출고와 관련된 재고 이력이 등록되면 이곳에서 확인할 수 있어요."
              />
            ) : (
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
      {/* 각 StockLocationItem 별 모달 렌더 */}
      {openUploadModals.map((open, idx) =>
        open ? (
          <StockLocationUploadModal key={idx} onClose={() => handleCloseUploadModal(idx)} />
        ) : null
      )}
    </>
  )
}

export default ProductDetail
