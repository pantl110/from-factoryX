import { RefCallback, useCallback, useEffect, useRef } from 'react';

interface UseInfiniteScrollOptionsProps {
  enabled?: boolean;
  hasMore: boolean;
  isLoading?: boolean;
  isFetchingMore?: boolean;
  onLoadMore?: () => void;
  rootMargin?: string;
  threshold?: number;
}

const useInfiniteScroll = <T extends Element = Element>({
  enabled = true,
  hasMore,
  isLoading = false,
  isFetchingMore = false,
  onLoadMore,
  rootMargin = '80px',
  threshold = 0.1,
}: UseInfiniteScrollOptionsProps): RefCallback<T> => {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const cleanupObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupObserver();
    };
  }, [cleanupObserver]);

  const handleRef = useCallback(
    (node: T | null) => {
      cleanupObserver();

      if (
        !enabled ||
        !hasMore ||
        !node ||
        !onLoadMore ||
        isLoading ||
        isFetchingMore
      ) {
        return;
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !isLoading && !isFetchingMore) {
              onLoadMore();
            }
          });
        },
        {
          rootMargin,
          threshold,
        }
      );

      observerRef.current.observe(node);
    },
    [
      cleanupObserver,
      enabled,
      hasMore,
      isFetchingMore,
      isLoading,
      onLoadMore,
      rootMargin,
      threshold,
    ]
  );

  return handleRef;
};

export default useInfiniteScroll;
