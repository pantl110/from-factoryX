import React from 'react';

interface InfoDetailProps {
  label: string;
  value: string;
}

const InfoDetail = ({ label, value }: InfoDetailProps) => {
  return (
    <div className="flex justify-between items-center">
      <div className="flex gap-2 items-center">
        <div className="w-1.5 h-1.5 bg-lg rounded-full" />
        <p className="m-Body-4 text-dg">{label}</p>
      </div>
      <p className="m-Body-4 text-dg">{value}</p>
    </div>
  );
};

export default InfoDetail;
