interface CommentItemProps {
  title: string;
  comment: string;
}

const CommentItem = ({ title, comment }: CommentItemProps) => {
  return (
    <div className="flex flex-col gap-1 bg-bg py-3 px-4 rounded-lg">
      <p className="Re_Body-1">{title}</p>
      <p className="Re_Body-1 text-dg">{comment}</p>
    </div>
  );
};

export default CommentItem;
