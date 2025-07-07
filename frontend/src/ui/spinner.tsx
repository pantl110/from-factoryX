import React from "react";

const Spinner = () => {
  const size = 52;
  const color = "var(--color-primary)";
  const bgColor = "var(--color-secondary-hover)";
  const strokeWidth = 11;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arc = circumference * 0.75; // 75%만 파란색

  return (
    <svg
      width={size}
      height={size}
      style={{ display: "block" }}
      viewBox={`0 0 ${size} ${size}`}
    >
      {/* 배경 원 */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={bgColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      
      {/* 파란색 원호 */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${arc} ${circumference - arc}`}
        strokeDashoffset="0"
        style={{
          transform: `rotate(-90deg)`,
          transformOrigin: "50% 50%",
          animation: "spinner-rotate 1.3s linear infinite",
        }}
      />
      <style>
        {`
          @keyframes spinner-rotate {
            100% {
              transform: rotate(270deg);
            }
          }
        `}
      </style>
    </svg>
  );
};

export default Spinner; 