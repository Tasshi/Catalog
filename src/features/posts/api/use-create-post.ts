import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postsKeys } from './use-posts';
import type { CreatePostValues } from '../schemas/post-schema';
import type { Post } from '../types';

const API_URL = 'https://jsonplaceholder.typicode.com';

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: CreatePostValues): Promise<Post> => {
      const res = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error('Failed to create post');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postsKeys.lists() });
    },
  });
};
