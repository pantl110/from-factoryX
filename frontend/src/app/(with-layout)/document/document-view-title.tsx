interface DocumentViewTitleProps {
  title: string
  dateLabel?: string
  date?: string
}

const DocumentViewTitle = ({ title, dateLabel, date }: DocumentViewTitleProps) => {
  return (
    <div className="flex justify-between">
      <h2 className="Heading-2">{title}</h2>
      <div className="flex items-center gap-3 px-3 Heading-5 text-sv">
        {dateLabel && <h5>{dateLabel}</h5>}
        {date && <h5>{date}</h5>}
      </div>
    </div>
  )
}

export default DocumentViewTitle
