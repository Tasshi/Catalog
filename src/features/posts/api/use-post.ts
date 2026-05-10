import { useQuery } from '@tanstack/react-query';
import { postsKeys } from './use-posts';
import type { Post } from '../types';

const API_URL = 'https://jsonplaceholder.typicode.com';

export const usePost = (id: number) => {
  return useQuery({
    queryKey: postsKeys.detail(id),
    queryFn: async (): Promise<Post> => {
      const res = await fetch(`${API_URL}/posts/${id}`);
      if (!res.ok) throw new Error('Failed to fetch post');
      return res.json();
    },
    enabled: Number.isFinite(id),
  });
};
