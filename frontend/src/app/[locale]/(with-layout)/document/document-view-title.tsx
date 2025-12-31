interface DocumentViewTitleProps {
  title: string;
}

const DocumentViewTitle = ({ title }: DocumentViewTitleProps) => {
  return (
    <div className="flex justify-between">
      <h2 className="Heading-2">{title}</h2>
    </div>
  );
};

export default DocumentViewTitle;
