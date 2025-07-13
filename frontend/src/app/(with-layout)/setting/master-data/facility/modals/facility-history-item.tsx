interface FacilityHistoryItemProps {
  productName: string
  quantity: number
  date: string
  unitTime: string
  deadlineTime: string
}

const FacilityHistoryItem = ({
  productName,
  quantity,
  date,
  unitTime,
  deadlineTime,
}: FacilityHistoryItemProps) => {
  return (
    <div className="h-14 flex items-center Me_Body-1 text-dg border-b border-[#eeeeee] cursor-pointer">
      <p className="flex-1 px-3 truncate" title={productName}>
        {productName}
      </p>
      <p className="flex-1 px-3">{quantity.toLocaleString()}</p>
      <p className="flex-1 px-3">{date}</p>
      <p className="flex-1 px-3">{unitTime}</p>
      <p className="flex-1 px-3">{deadlineTime}</p>
    </div>
  )
}

export default FacilityHistoryItem
