import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 min — serve from cache, revalidate in background
      gcTime:    24 * 60 * 60 * 1000, // 24 h — keep in localStorage
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'ppc-rq-cache',
});
