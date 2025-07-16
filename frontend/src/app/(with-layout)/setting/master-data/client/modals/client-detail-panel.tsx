import { formatBusinessNumber, formatFaxNumber, formatPhoneNumber } from '@/hooks'
import useGetClientDetail from '@/hooks/factory-client/use-get-client-detail'
import { ClientTypeColorMap } from '@/types/status-type'
import Chip from '@/ui/chip'
import InfoLabelValue from '@/ui/info-label-value'
import Panel from '@/ui/panel'
import { useEffect } from 'react'

interface ClientDetailPanelProps {
  clientId: number
  factoryId: number
  onClose: () => void
}

const ClientDetailPanel = ({ clientId, factoryId, onClose }: ClientDetailPanelProps) => {
  const { getClientDetail, clientDetail, isLoading, error } = useGetClientDetail()
  const clientDetailType = '발주처'
  const clientTypeColor = ClientTypeColorMap[clientDetailType as keyof typeof ClientTypeColorMap]

  useEffect(() => {
    if (clientId && factoryId) {
      getClientDetail({ client_id: clientId, factory_id: factoryId })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, factoryId])

  if (isLoading) return <div>상세 정보 불러오는 중...</div>
  if (error) return <div>오류: {error}</div>
  if (!clientDetail) return null

  // 기존 상세 정보 UI를 clientDetail로 렌더링
  return (
    <Panel title="거래처" onClose={onClose} hasSaveButton={true}>
      <div className="flex flex-col gap-3">
        <h3 className="Heading-3">거래처 정보</h3>

        <div>
          <div className="flex">
            <InfoLabelValue label="거래처명" value={clientDetail.name} isEditing={true} />
            <InfoLabelValue
              label="사업자등록번호"
              value={formatBusinessNumber(clientDetail.business_registration_number)}
              isEditing={true}
            />
          </div>
          <div className="flex">
            <InfoLabelValue
              label="대표자명"
              value={clientDetail.representative_name}
              isEditing={true}
            />
            <InfoLabelValue label="이메일" value={clientDetail.email} isEditing={true} />
          </div>
          <div className="flex">
            <InfoLabelValue
              label="연락처"
              value={formatPhoneNumber(clientDetail.phone || '')}
              isEditing={true}
              placeholder="-"
            />
            <InfoLabelValue
              label="팩스 번호"
              value={formatFaxNumber(clientDetail.fax || '')}
              isEditing={true}
              placeholder="-"
            />
          </div>
          <div className="flex">
            <InfoLabelValue label="업태" value={clientDetail.business_type} isEditing={true} />
            <InfoLabelValue label="종목" value={clientDetail.business_category} isEditing={true} />
          </div>
          <div className="flex">
            <InfoLabelValue label="사업장 주소" value={clientDetail.address} isEditing={true} />
          </div>
          <div className="flex">
            <InfoLabelValue
              label="거래처"
              value={
                <Chip
                  text={clientDetailType}
                  bgColor={clientTypeColor.bgColor}
                  textColor={clientTypeColor.textColor}
                />
              }
            />
          </div>
          <div className="flex border-b border-lg w-full">
            <InfoLabelValue
              label="비고"
              value=""
              isEditing={true}
              placeholder="-"
              textarea={true}
            />
          </div>
        </div>
      </div>
    </Panel>
  )
}

export default ClientDetailPanel
