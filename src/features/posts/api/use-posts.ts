import { useQuery } from '@tanstack/react-query';
import type { Post } from '../types';

const API_URL = 'https://jsonplaceholder.typicode.com';

export const postsKeys = {
  all: ['posts'] as const,
  lists: () => [...postsKeys.all, 'list'] as const,
  detail: (id: number) => [...postsKeys.all, 'detail', id] as const,
};

export const usePosts = () => {
  return useQuery({
    queryKey: postsKeys.lists(),
    queryFn: async (): Promise<Post[]> => {
      const res = await fetch(`${API_URL}/posts`);
      if (!res.ok) throw new Error('Failed to fetch posts');
      return res.json();
    },
  });
};
