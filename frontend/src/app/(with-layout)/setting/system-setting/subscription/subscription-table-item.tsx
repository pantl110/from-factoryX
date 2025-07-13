interface SubscriptionTableItemProps {
  date: string
  card: string
  amount: string
  plan: string
}

const SubscriptionTableItem = ({ date, card, amount, plan }: SubscriptionTableItemProps) => {
  return (
    <div className="flex items-center justify-between w-full h-14 text-dg Me_Body-1 border-b border-[#eeeeee]">
      <p className="flex-1">{date}</p>
      <p className="flex-[2]">{card}</p>
      <p className="flex-1">{amount}</p>
      <p className="flex-1">{plan}</p>
    </div>
  )
}

export default SubscriptionTableItem
