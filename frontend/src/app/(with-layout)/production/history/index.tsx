import DocumentTitle from './document-title'
import HistoryTableHeader from './history-table-header'
import HistoryTableItem from './history-table-item'

const History = () => {
  return (
    <div className="flex flex-col gap-5 p-5 w-[920px]">
      <DocumentTitle />
      <div>
        <HistoryTableHeader />
        <HistoryTableItem />
        <HistoryTableItem />
        <HistoryTableItem />
        <HistoryTableItem />
        <HistoryTableItem />
        <HistoryTableItem />
        <HistoryTableItem />
        <HistoryTableItem />
        <HistoryTableItem />
        <HistoryTableItem />
      </div>
    </div>
  )
}

export default History
