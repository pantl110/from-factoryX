import { useEffect, useRef, useState } from 'react';
import { getVisibleItemCount } from './utils';

interface UseVisibleItemCountProps {
  minItemWidth?: number;
  minItemHeight?: number;
  gap?: number;
}

const useVisibleItemCount = (options?: UseVisibleItemCountProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const updateCount = () => {
      const { width, height } = container.getBoundingClientRect();
      setVisibleCount(getVisibleItemCount(width, height, options));
    };

    updateCount();
    const observer = new ResizeObserver(updateCount);
    observer.observe(container);

    return () => observer.disconnect();
  }, [options]);

  return { containerRef, visibleCount };
};

export default useVisibleItemCount;
