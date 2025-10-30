'use client';

import { PropsWithChildren, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const QueryClientRootProvider = ({ children }: PropsWithChildren) => {
  const queryClientRef = useRef<QueryClient | null>(null);
  if (queryClientRef.current === null) {
    queryClientRef.current = new QueryClient();
  }
  return (
    <QueryClientProvider client={queryClientRef.current}>
      {children}
    </QueryClientProvider>
  );
};

export default QueryClientRootProvider;
