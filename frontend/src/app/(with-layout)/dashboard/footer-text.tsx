interface FooterTextProps {
  title: string;
  content?: string;
}

const FooterText = ({ title, content }: FooterTextProps) => {
  return (
    <div className="flex gap-2.5 h-5 items-center text-[#8F8F8F] text-[14px] font-normal font-['Pretendard']">
      <p>{title}</p>
      {content && <p>{content}</p>}
    </div>
  );
};

export default FooterText;
