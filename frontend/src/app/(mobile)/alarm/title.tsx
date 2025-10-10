import React from 'react';

interface TitleProps {
  icon: React.ReactNode;
  title: string;
  count: number;
}

const Title = ({ icon, title, count }: TitleProps) => {
  return (
    <div className="flex items-center gap-1.5 px-7">
      {React.cloneElement(
        icon as React.ReactElement<{ size: number; className?: string }>,
        {
          size: 20,
          className: 'text-primary',
        }
      )}
      <h4 className="m-Heading-4b">{title}</h4>
      <div className="flex items-center justify-center w-[22px] h-[22px] rounded-full bg-primary-8">
        <h6 className="m-Heading-6 text-primary">{count}</h6>
      </div>
    </div>
  );
};

export default Title;
