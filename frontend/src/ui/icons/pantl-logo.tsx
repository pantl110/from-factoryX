interface PantlLogoProps {
  className?: string;
  width?: number;
  height?: number;
  color?: string;
}

const LOGO_ASPECT_RATIO = 120 / 490.347;

const PantlLogo = ({
  className,
  width = 131,
  color = '#5F6870',
}: PantlLogoProps) => {
  // height는 width에 맞춰 로고 비율대로 계산 (전달된 height는 무시)
  const height = width * LOGO_ASPECT_RATIO;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      className={className}
      viewBox="0 0 490.347 120"
    >
      <path
        d="M 87.735 0 L 87.735 74.731 L 22.573 74.731 L 22.573 120 L 0 120 L 0 0 Z M 65.094 20.571 C 60.386 20.492 52.463 20.571 47.088 20.571 L 22.567 20.571 L 22.567 54.165 L 65.094 54.165 Z M 490.347 97.818 L 490.347 120 L 412.573 120 L 412.573 20.571 L 375.288 20.571 L 375.288 120 L 350.847 120 L 350.847 20.571 L 326.357 20.571 L 289.078 120 L 243.441 120 L 243.441 20.571 L 239.167 20.571 L 202.604 120 L 159.545 120 L 159.545 74.737 L 115.427 74.737 L 115.427 120 L 92.853 120 L 92.853 0 L 182.112 0 L 182.112 97.818 L 185.039 97.818 L 220.892 0 L 266.29 0 L 266.29 97.818 L 269.351 97.818 L 309.018 0 L 435.037 0 L 435.037 97.818 Z M 159.539 20.571 L 115.42 20.571 L 115.42 54.165 L 159.539 54.165 Z"
        fill={color}
      />
      {/* L 우상단 브랜드 그린 점 */}
      <rect x="457" y="0" width="33.347" height="33.347" fill="#00E980" />
      {/* 우하단 버전 표기 110 */}
      <text
        x="490.347"
        y="119"
        textAnchor="end"
        fontSize="30"
        fontWeight="700"
        fill={color}
      >
        110
      </text>
    </svg>
  );
};

export default PantlLogo;
